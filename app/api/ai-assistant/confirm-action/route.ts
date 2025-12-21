import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { withCompanyScope } from '@/lib/prisma-middleware';
import { executeAiFunction } from '@/lib/ai/function-executors';
import { createAuditLog } from '@/lib/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { userId, companyId, userRole } = await enforceAll(session);
    const prisma = withCompanyScope(companyId);
    const { actionId, confirmed } = await request.json();

    if (!actionId) {
      return NextResponse.json(
        { error: 'Action ID is required' },
        { status: 400 }
      );
    }

    const action = await prisma.aiAction.findFirst({
      where: { id: actionId, userId },
    });

    if (!action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (!confirmed) {
      const cancelled = await prisma.aiAction.update({
        where: { id: action.id },
        data: { status: 'CANCELLED' },
      });
      return NextResponse.json({ success: true, action: cancelled });
    }

    // Confirm and execute
    await prisma.aiAction.update({
      where: { id: action.id },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });

    const parsedArgs = action.proposedData ? JSON.parse(action.proposedData) : {};
    const executionResult = await executeAiFunction(action.actionType, parsedArgs, {
      userId,
      companyId,
      branchId: session?.user?.branchId ?? null,
      userRole: userRole as any,
    });

    const updated = await prisma.aiAction.update({
      where: { id: action.id },
      data: {
        status: executionResult.success ? 'EXECUTED' : 'FAILED',
        executedAt: new Date(),
        executedData: executionResult.success
          ? JSON.stringify(executionResult.data ?? {})
          : null,
        errorMessage: executionResult.success ? null : executionResult.error,
      },
    });

    // Log audit entry for executed actions
    if (executionResult.success) {
      await createAuditLog({
        companyId,
        userId,
        entityType: action.actionType,
        entityId: action.id,
        action: 'EXECUTE',
        changes: { proposed: parsedArgs, result: executionResult.data ?? {} },
        source: 'ai',
      });
    }

    return NextResponse.json({
      success: executionResult.success,
      result: executionResult.data,
      error: executionResult.error,
      action: updated,
    });
  } catch (error: any) {
    console.error('AI action confirmation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to confirm action' },
      { status: 500 }
    );
  }
}
