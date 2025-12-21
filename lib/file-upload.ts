import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const UPLOAD_CONFIG = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: ['application/pdf'],
  uploadDir: path.join(process.cwd(), 'uploads'),
};

/**
 * Validates a PDF file before upload
 */
export function validatePdfFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!UPLOAD_CONFIG.allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Only PDF files are accepted' };
  }

  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return { valid: false, error: 'PDF must be under 50MB' };
  }

  // Check filename for security (no path traversal)
  if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
    return { valid: false, error: 'Invalid filename' };
  }

  return { valid: true };
}

/**
 * Saves an uploaded PDF file to the file system
 * @param companyId - Company ID for scoping
 * @param bomDraftId - BOM draft ID for unique naming
 * @param file - The PDF file to save
 * @returns File metadata
 */
export async function saveUploadedPdf(
  companyId: string,
  bomDraftId: string,
  file: File
): Promise<{ filePath: string; fileName: string; fileSize: number }> {
  // Validate file
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Create upload directory path
  const uploadPath = path.join(
    UPLOAD_CONFIG.uploadDir,
    companyId,
    'bom-pdfs'
  );

  // Ensure directory exists
  if (!existsSync(uploadPath)) {
    await mkdir(uploadPath, { recursive: true });
  }

  // Generate safe filename
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${bomDraftId}-${sanitizedName}`;
  const absolutePath = path.join(uploadPath, fileName);

  // Save file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  await writeFile(absolutePath, buffer);

  // Return relative path for database storage
  const relativePath = path.join(companyId, 'bom-pdfs', fileName);

  return {
    filePath: relativePath,
    fileName: file.name,
    fileSize: buffer.length,
  };
}

/**
 * Converts a relative file path to an absolute path
 * @param relativePath - Relative path from uploads directory
 * @returns Absolute file path
 */
export function getAbsolutePdfPath(relativePath: string): string {
  return path.join(UPLOAD_CONFIG.uploadDir, relativePath);
}

/**
 * Checks if a PDF file has the correct magic bytes
 * @param buffer - File buffer
 * @returns True if file starts with PDF signature
 */
export function isPdfFile(buffer: Buffer): boolean {
  // PDF files start with %PDF-
  const pdfSignature = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2D]);
  return buffer.slice(0, 5).equals(pdfSignature);
}
