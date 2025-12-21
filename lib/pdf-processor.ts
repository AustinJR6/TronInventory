import { readFile } from 'fs/promises';

/**
 * Extracts text content from a PDF file
 * @param pdfPath - Absolute path to the PDF file or Blob URL
 * @returns Extracted text content
 */
export async function extractPdfText(pdfPath: string): Promise<string> {
  try {
    let dataBuffer: Buffer;

    // Check if it's a Blob URL or local file path
    if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
      // Fetch from Blob storage
      console.log('Fetching PDF from Blob URL:', pdfPath);
      const response = await fetch(pdfPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from Blob: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      dataBuffer = Buffer.from(arrayBuffer);
    } else {
      // Read from local file system
      console.log('Reading PDF from local path:', pdfPath);
      dataBuffer = await readFile(pdfPath);
    }

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
 * @param pdfPath - Absolute path to the PDF file or Blob URL
 * @returns PDF metadata
 */
export async function getPdfMetadata(pdfPath: string): Promise<{
  pages: number;
  info: any;
}> {
  try {
    let dataBuffer: Buffer;

    // Check if it's a Blob URL or local file path
    if (pdfPath.startsWith('http://') || pdfPath.startsWith('https://')) {
      // Fetch from Blob storage
      const response = await fetch(pdfPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF from Blob: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      dataBuffer = Buffer.from(arrayBuffer);
    } else {
      // Read from local file system
      dataBuffer = await readFile(pdfPath);
    }

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
