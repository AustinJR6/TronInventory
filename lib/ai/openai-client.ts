import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. AI assistant will operate in stub mode.');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const AI_MODELS = {
  chat: process.env.AI_CHAT_MODEL || 'gpt-4-turbo-preview',
  transcription: 'whisper-1',
};

export const AI_DEFAULTS = {
  temperature: Number(process.env.AI_TEMPERATURE ?? 0.2),
  maxTokens: Number(process.env.AI_MAX_TOKENS ?? 4000),
};
