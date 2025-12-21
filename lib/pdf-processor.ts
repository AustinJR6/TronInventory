import { readFile } from 'fs/promises';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Disable worker for server-side usage
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

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

    // Use pdfjs-dist to extract text
    // Convert Buffer to Uint8Array (pdfjs-dist requirement)
    const uint8Array = new Uint8Array(dataBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;

    let fullText = '';
    const numPages = pdfDocument.numPages;

    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
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

    // Use pdfjs-dist to get metadata
    // Convert Buffer to Uint8Array (pdfjs-dist requirement)
    const uint8Array = new Uint8Array(dataBuffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
    const pdfDocument = await loadingTask.promise;
    const metadata = await pdfDocument.getMetadata();

    return {
      pages: pdfDocument.numPages,
      info: metadata.info,
    };
  } catch (error) {
    console.error('PDF metadata extraction error:', error);
    throw new Error('Failed to extract PDF metadata');
  }
}
