import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { enforceAll } from '@/lib/enforcement';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId } = await enforceAll(session, {
      role: 'ADMIN',
    });

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const users = await scopedPrisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vehicleNumber: true,
        branchId: true,
        active: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId } = await enforceAll(session, {
      role: 'ADMIN',
    });

    // Use company-scoped Prisma client for creation
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { email, name, password, role, vehicleNumber, branchId } = body;

    // Check if email exists globally (emails are globally unique)
    const { prisma } = require('@/lib/prisma');
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, companyId: true },
    });

    if (existingUser) {
      if (existingUser.companyId === companyId) {
        return NextResponse.json(
          { error: 'User with this email already exists in your company' },
          { status: 409 }
        );
      } else {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await scopedPrisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        vehicleNumber: role === 'FIELD' ? vehicleNumber : null,
        branchId: branchId || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vehicleNumber: true,
        branchId: true,
        active: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
    });

    return NextResponse.json({ user, message: 'User created successfully' });
  } catch (error: any) {
    console.error('Error creating user:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce authentication, role, and get scoped context
    const { companyId } = await enforceAll(session, {
      role: 'ADMIN',
    });

    // Use company-scoped Prisma client
    const scopedPrisma = withCompanyScope(companyId);

    const body = await request.json();
    const { userId, active } = body;

    const user = await scopedPrisma.user.update({
      where: { id: userId },
      data: { active },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        vehicleNumber: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Error updating user:', error);
    const status = error.message?.includes('required') ? 401 :
                   error.message?.includes('Access denied') ? 403 : 500;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status });
  }
}
