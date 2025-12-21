import { openai, AI_CONFIG } from './openai-client';
import { extractPdfText } from './pdf-processor';

export interface ExtractedBomItem {
  itemName: string;
  quantity: number;
  unit?: string;
  category?: string;
  wireSize?: string; // e.g., "10 AWG", "12 AWG", "#6"
  conduitSize?: string; // e.g., "1/2\"", "3/4\"", "2\""
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Extracts Bill of Materials from a PDF planset using OpenAI
 * @param pdfPath - Absolute path to the PDF file
 * @param warehouseInventory - Current warehouse inventory for context
 * @returns Array of extracted BOM items
 */
export async function extractBomFromPdf(
  pdfPath: string,
  warehouseInventory: Array<{
    id: string;
    itemName: string;
    sku?: string | null;
    category: string;
    unit: string;
  }>
): Promise<ExtractedBomItem[]> {
  // Step 1: Extract text from PDF
  const pdfText = await extractPdfText(pdfPath);

  if (!pdfText || pdfText.trim().length === 0) {
    throw new Error('No text content found in PDF');
  }

  // Step 2: Create warehouse inventory context for better matching
  const inventoryContext = warehouseInventory
    .slice(0, 100) // Limit to avoid token overflow
    .map((item) => `${item.itemName} (${item.category}) - SKU: ${item.sku || 'N/A'} - Unit: ${item.unit}`)
    .join('\n');

  // Step 3: Use more PDF content to capture line diagrams and specifications
  const maxContentLength = 30000; // Increased from 12000 to capture more detail
  const pdfContent = pdfText.substring(0, maxContentLength);

  // Step 4: Create prompt for OpenAI
  const prompt = `You are an expert construction materials analyst specializing in solar installations. Analyze this construction planset and extract a comprehensive Bill of Materials (BOM).

WAREHOUSE INVENTORY CONTEXT (for reference):
${inventoryContext}

PDF CONTENT:
${pdfContent}

TASK:
1. Extract ALL materials, parts, and components mentioned ANYWHERE in the planset
2. Search the ENTIRE document including:
   - BOM tables (if present)
   - Line diagrams and electrical diagrams
   - Wire schedules and conduit schedules
   - Notes and specifications sections
   - Circuit descriptions and callouts
3. Extract quantities - convert to integers (round up if fractional)
4. Determine units of measurement (ea, ft, box, roll, etc.)
5. Categorize each item (conduit, wire, panels, connectors, mounting, electrical, etc.)
6. For wire items: CRITICALLY IMPORTANT - Search line diagrams for wire sizes/gauges
   - Look for notations like "10 AWG", "12 AWG", "#6 THHN", "#8", etc.
   - Check circuit labels, wire callouts, and connection details
7. For conduit items: CRITICALLY IMPORTANT - Search line diagrams for conduit sizes
   - Look for notations like "1/2\" EMT", "3/4\" PVC", "2\" conduit", etc.
   - Check raceway schedules and conduit run specifications
8. Assign confidence level:
   - HIGH: Quantity and item clearly stated with specific details
   - MEDIUM: Item mentioned with quantity but some ambiguity
   - LOW: Item inferred or quantity estimated

CRITICAL REQUIREMENTS FOR WIRE AND CONDUIT:
- Wire and conduit specifications are OFTEN found in line diagrams, NOT in BOM tables
- You MUST search the entire document for wire gauge and conduit size information
- Every wire item MUST include its gauge/size (e.g., "10 AWG THHN Wire")
- Every conduit item MUST include its size (e.g., "3/4\" EMT Conduit")
- If you find wire without a size specified, search diagrams and notes for the circuit details
- If you find conduit without a size, search for raceway schedules or conduit run details

IMPORTANT GUIDELINES:
- This BOM must include ALL equipment needed to COMPLETELY finish the job
- Include ONLY materials that need to be ordered/supplied
- Do NOT include labor, permits, or services
- Be specific with item names (e.g., "2\" EMT Conduit" not just "Conduit")
- If multiple similar items with different sizes, list them separately
- Use common construction/solar terminology
- Search thoroughly - missing wire sizes or conduit sizes means an incomplete BOM

RESPONSE FORMAT (JSON array only, no markdown):
[
  {
    "itemName": "string (specific item name)",
    "quantity": number (integer),
    "unit": "string (ea, ft, box, etc.)",
    "category": "string (conduit, wire, panels, etc.)",
    "wireSize": "string (ONLY if wire/cable - e.g., '10 AWG', '12 AWG', '#6')",
    "conduitSize": "string (ONLY if conduit - e.g., '1/2\"', '3/4\"', '2\"')",
    "confidence": "HIGH|MEDIUM|LOW"
  }
]

Return ONLY the JSON array with no additional text, explanations, or markdown formatting.`;

  try {
    // Step 4: Call OpenAI API
    const response = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxTokens,
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error('OpenAI returned empty response');
    }

    // Step 5: Parse JSON response
    // Remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const extractedItems: ExtractedBomItem[] = JSON.parse(cleanedContent);

    // Step 6: Validate and sanitize
    const validItems = extractedItems.filter((item) => {
      return (
        item.itemName &&
        item.itemName.length > 0 &&
        item.quantity &&
        item.quantity > 0 &&
        ['HIGH', 'MEDIUM', 'LOW'].includes(item.confidence)
      );
    });

    if (validItems.length === 0) {
      throw new Error('No valid materials found in PDF');
    }

    return validItems;
  } catch (error: any) {
    console.error('BOM extraction error:', error);

    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response - invalid JSON format');
    }

    if (error.message?.includes('API key')) {
      throw new Error('OpenAI API key is invalid or missing');
    }

    throw new Error(`AI processing failed: ${error.message}`);
  }
}
