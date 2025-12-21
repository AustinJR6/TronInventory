import { readFile, writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
// @ts-ignore - pdf2json doesn't have great types
import PDFParser from 'pdf2json';

/**
 * Extracts text content from a PDF file
 * @param pdfPath - Absolute path to the PDF file or Blob URL
 * @returns Extracted text content
 */
export async function extractPdfText(pdfPath: string): Promise<string> {
  try {
    let pdfBuffer: Buffer;
    let tempFilePath: string | null = null;

    // Check if it's a Blob URL or local file path
    if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
      // Fetch from Blob storage
      console.log('Fetching PDF from Blob URL:', pdfPath);
      const response = await fetch(pdfPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from Blob: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);

      // pdf2json needs a file path, so write to temp file
      tempFilePath = join(tmpdir(), `pdf-${Date.now()}.pdf`);
      await writeFile(tempFilePath, pdfBuffer);
      pdfPath = tempFilePath;
    } else {
      // Read from local file system
      console.log('Reading PDF from local path:', pdfPath);
    }

    // Use pdf2json to extract text
    return new Promise<string>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF parsing error:', errData.parserError);
        reject(new Error('Failed to parse PDF'));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // Extract text from all pages
          let fullText = '';

          if (pdfData.Pages) {
            pdfData.Pages.forEach((page: any) => {
              if (page.Texts) {
                page.Texts.forEach((text: any) => {
                  if (text.R) {
                    text.R.forEach((r: any) => {
                      if (r.T) {
                        // Decode URI component (pdf2json encodes text)
                        fullText += decodeURIComponent(r.T) + ' ';
                      }
                    });
                  }
                });
                fullText += '\n';
              }
            });
          }

          // Clean up temp file if we created one
          if (tempFilePath) {
            unlink(tempFilePath).catch(() => {});
          }

          resolve(fullText.trim());
        } catch (error) {
          reject(error);
        }
      });

      pdfParser.loadPDF(pdfPath);
    });
  } catch (error) {
    console.error('PDF text extraction error:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Gets metadata about a PDF file
 * @param pdfPath - Absolute path to the PDF file or Blob URL
 * @returns PDF metadata
 */
export async function getPdfMetadata(pdfPath: string): Promise<{
  pages: number;
  info: any;
}> {
  try {
    let pdfBuffer: Buffer;
    let tempFilePath: string | null = null;

    // Check if it's a Blob URL or local file path
    if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
      // Fetch from Blob storage
      const response = await fetch(pdfPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from Blob: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      pdfBuffer = Buffer.from(arrayBuffer);

      // pdf2json needs a file path, so write to temp file
      tempFilePath = join(tmpdir(), `pdf-${Date.now()}.pdf`);
      await writeFile(tempFilePath, pdfBuffer);
      pdfPath = tempFilePath;
    }

    // Use pdf2json to get metadata
    return new Promise<{ pages: number; info: any }>((resolve, reject) => {
      const pdfParser = new PDFParser();

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF metadata extraction error:', errData.parserError);
        reject(new Error('Failed to extract PDF metadata'));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        // Clean up temp file if we created one
        if (tempFilePath) {
          unlink(tempFilePath).catch(() => {});
        }

        resolve({
          pages: pdfData.Pages?.length || 0,
          info: pdfData.Meta || {},
        });
      });

      pdfParser.loadPDF(pdfPath);
    });
  } catch (error) {
    console.error('PDF metadata extraction error:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}
