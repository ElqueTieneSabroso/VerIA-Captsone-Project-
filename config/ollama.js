// Ollama is tunnelled through ngrok so the Expo app on a physical device can
// reach your local machine.  Start the tunnel with:
//   ngrok http --url=stratus-catty-trump.ngrok-free.dev 11434
//
// For local-only testing (simulators / Expo web) you can swap back to:
//   http://localhost:11434
export const OLLAMA_BASE_URL = 'https://stratus-catty-trump.ngrok-free.dev';
export const OLLAMA_MODEL = 'openbmb/minicpm-v4.5';

export const ASSISTIVE_SYSTEM_PROMPT =
  'You are an assistive visual assistant for the blind, similar to Be My Eyes. Provide a concise, clear, and highly descriptive summary of the image. Avoid long-winded or overly granular explanations. Focus on the most important elements, text, and obstacles in front of the user.';
