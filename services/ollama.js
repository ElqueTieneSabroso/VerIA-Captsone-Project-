import {
  ASSISTIVE_SYSTEM_PROMPT,
  OLLAMA_BASE_URL,
  OLLAMA_MODEL,
} from '../config/ollama';

// Timeout (ms) for the Ollama request – vision models can be slow.
const REQUEST_TIMEOUT_MS = 120_000;

export async function describeImageWithOllama(base64Image) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Required for ngrok free-tier: skips the browser interstitial page
        // so we receive JSON instead of an HTML warning page.
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [
          { role: 'system', content: ASSISTIVE_SYSTEM_PROMPT },
          {
            role: 'user',
            content: 'Describe what is in this image for the user.',
            images: [base64Image],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama request failed (${response.status}): ${errorText || response.statusText}`,
      );
    }

    const data = await response.json();
    const description = data?.message?.content?.trim();

    if (!description) {
      throw new Error('Ollama returned an empty description.');
    }

    return description;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(
        'The AI request timed out. Make sure Ollama is running and the ngrok tunnel is active.',
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

