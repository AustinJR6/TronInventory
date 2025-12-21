import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';
import { saveUploadedPdf } from '@/lib/file-upload';

// Increase timeout for large file uploads
export const maxDuration = 300; // 5 minutes
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session, { role: 'FIELD' });
    const scopedPrisma = withCompanyScope(companyId);

    console.log('Upload request received, parsing form data...');

    // Parse form data
    const formData = await request.formData();
    console.log('Form data parsed successfully');
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string | null;

    console.log(`File received: ${file?.name}, size: ${file?.size} bytes (${(file?.size || 0) / 1024 / 1024} MB)`);

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'BOM name is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are accepted' },
        { status: 400 }
      );
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'PDF must be under 50MB' },
        { status: 400 }
      );
    }

    // Create draft first to get ID
    const bomDraft = await scopedPrisma.bomDraft.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
        pdfFileName: '', // Will update after saving file
        pdfFilePath: '',
        pdfFileSize: 0,
        status: 'DRAFT',
      },
    });

    try {
      // Save file with bomDraft ID
      const { filePath, fileName, fileSize } = await saveUploadedPdf(
        companyId,
        bomDraft.id,
        file
      );

      // Update draft with file info
      const updatedDraft = await scopedPrisma.bomDraft.update({
        where: { id: bomDraft.id },
        data: {
          pdfFileName: fileName,
          pdfFilePath: filePath,
          pdfFileSize: fileSize,
        },
      });

      return NextResponse.json({
        bomDraft: {
          id: updatedDraft.id,
          name: updatedDraft.name,
          description: updatedDraft.description,
          status: updatedDraft.status,
          pdfFileName: updatedDraft.pdfFileName,
          createdAt: updatedDraft.createdAt,
        },
      });
    } catch (fileError: any) {
      // If file save fails, delete the draft
      await scopedPrisma.bomDraft.delete({ where: { id: bomDraft.id } });
      throw fileError;
    }
  } catch (error: any) {
    console.error('BOM upload error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);

    // Check for specific Vercel errors
    if (error.message?.includes('FUNCTION_PAYLOAD_TOO_LARGE')) {
      return NextResponse.json(
        { error: 'File size exceeds Vercel plan limits. Please upgrade your Vercel plan or use a smaller PDF.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Upload failed - please try again' },
      { status: 500 }
    );
  }
}
