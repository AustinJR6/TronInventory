import { readFile } from 'fs/promises';

/**
 * Extracts text content from a PDF file
 * @param pdfPath - Absolute path to the PDF file
 * @returns Extracted text content
 */
export async function extractPdfText(pdfPath: string): Promise<string> {
  try {
    const dataBuffer = await readFile(pdfPath);
    // Dynamic import for CommonJS module
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Gets metadata about a PDF file
 * @param pdfPath - Absolute path to the PDF file
 * @returns PDF metadata
 */
export async function getPdfMetadata(pdfPath: string): Promise<{
  pages: number;
  info: any;
}> {
  try {
    const dataBuffer = await readFile(pdfPath);
    // Dynamic import for CommonJS module
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(dataBuffer);
    return {
      pages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error('PDF metadata extraction error:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}
