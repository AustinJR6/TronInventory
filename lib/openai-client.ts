import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set in environment variables');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'placeholder-key',
});

export const AI_CONFIG = {
  model: 'gpt-4-turbo-preview',
  temperature: 0.2, // Low temperature for consistent, deterministic extraction
  maxTokens: 4000,
};
