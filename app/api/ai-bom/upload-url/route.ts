import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { enforceAll } from '@/lib/enforcement';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate and get session
    const session = await getServerSession(authOptions);
    await enforceAll(session, { role: ['ADMIN', 'FIELD'] });

    const body = (await request.json()) as HandleUploadBody;

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type and generate token
        console.log('Generating upload token for:', pathname);

        return {
          allowedContentTypes: ['application/pdf'],
          tokenPayload: JSON.stringify({
            // You can add custom metadata here if needed
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
        // We'll handle the draft creation in a separate endpoint
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error: any) {
    console.error('Upload URL generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
