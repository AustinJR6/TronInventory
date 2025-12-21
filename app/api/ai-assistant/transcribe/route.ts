import { NextRequest, NextResponse } from 'next/server';
import { openai, AI_MODELS } from '@/lib/ai/openai-client';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY not set. Voice transcription unavailable.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audio = formData.get('audio');

    if (!audio || !(audio instanceof File)) {
      return NextResponse.json(
        { error: 'Audio file is required under the "audio" field.' },
        { status: 400 }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      model: AI_MODELS.transcription,
      file: audio,
      response_format: 'text',
    });

    return NextResponse.json({ text: transcription });
  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
}
