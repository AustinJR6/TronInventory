import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'Voice transcription is not available yet. This endpoint is stubbed for Phase 3.',
    },
    { status: 501 }
  );
}
