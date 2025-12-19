import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { enforceAll } from '@/lib/enforcement';

/**
 * GET /api/companies/[id]
 * Get company details (branding, name, etc.)
 * Users can only access their own company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication
    const { companyId } = await enforceAll(session);

    // Await params (Next.js 15+)
    const { id } = await params;

    // Validate user can only access their own company
    if (id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied. You can only view your own company.' },
        { status: 403 }
      );
    }

    // Query using authenticated user's companyId
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        appName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error: any) {
    console.error('Error fetching company:', error);
    const status = error.message?.includes('Authentication required') ? 401 : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}

/**
 * PATCH /api/companies/[id]
 * Update company branding (admin only)
 * Fields: name, logoUrl, primaryColor, appName
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication and ADMIN role
    const { companyId } = await enforceAll(session, {
      role: 'ADMIN',
    });

    // Await params (Next.js 15+)
    const { id } = await params;

    // Validate user can only update their own company
    if (id !== companyId) {
      return NextResponse.json(
        { error: 'Access denied. You can only update your own company.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, logoUrl, primaryColor, appName } = body;

    // Build update data (only include provided fields)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor;
    if (appName !== undefined) updateData.appName = appName;

    // Update using authenticated user's companyId
    const company = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        appName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      company,
      message: 'Company branding updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating company:', error);
    const status = error.message?.includes('required')
      ? 401
      : error.message?.includes('Access denied')
      ? 403
      : 500;
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status }
    );
  }
}
