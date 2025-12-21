import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId, userId } = await enforceAll(session, { role: 'FIELD' });
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { blobUrl, fileName, fileSize, name, description } = body;

    console.log('Creating BOM draft with blob URL:', blobUrl);

    // Validate inputs
    if (!blobUrl || !fileName) {
      return NextResponse.json(
        { error: 'Blob URL and file name are required' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'BOM name is required' },
        { status: 400 }
      );
    }

    // Create draft with blob URL
    const bomDraft = await scopedPrisma.bomDraft.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId,
        pdfFileName: fileName,
        pdfFilePath: blobUrl, // Store the Blob URL
        pdfFileSize: fileSize || 0,
        status: 'DRAFT',
      },
    });

    return NextResponse.json({
      bomDraft: {
        id: bomDraft.id,
        name: bomDraft.name,
        description: bomDraft.description,
        status: bomDraft.status,
        pdfFileName: bomDraft.pdfFileName,
        createdAt: bomDraft.createdAt,
      },
    });
  } catch (error: any) {
    console.error('BOM draft creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Draft creation failed - please try again' },
      { status: 500 }
    );
  }
}
