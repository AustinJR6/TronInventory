import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';

export async function GET(request: NextRequest) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    const { companyId, userId, userRole } = await enforceAll(session);
    const scopedPrisma = withCompanyScope(companyId);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where clause
    const where: any = {};

    // Field users see only their own drafts
    if (userRole === 'FIELD') {
      where.userId = userId;
    }

    // Filter by status if provided
    if (status) {
      where.status = status;
    }

    // Fetch drafts with item counts
    const drafts = await scopedPrisma.bomDraft.findMany({
      where,
      include: {
        items: {
          select: {
            id: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data
    const transformedDrafts = drafts.map((draft: any) => ({
      id: draft.id,
      name: draft.name,
      description: draft.description,
      status: draft.status,
      pdfFileName: draft.pdfFileName,
      itemCount: draft.items.length,
      createdBy: draft.user.name,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      submittedAt: draft.submittedAt,
      aiProcessingError: draft.aiProcessingError,
    }));

    return NextResponse.json({ drafts: transformedDrafts });
  } catch (error: any) {
    console.error('Fetch drafts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}
