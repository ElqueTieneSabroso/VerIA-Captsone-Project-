import { fetch } from "expo/fetch";
import { ANALYZE_ENDPOINT } from "../config/ollama";

const REQUEST_TIMEOUT_MS = 300_000;

export async function analyzeImageWithBackend(imageBase64) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Image analysis failed (${response.status}): ${errorText || response.statusText}`,
      );
    }

    const data = await response.json();
    const description = data?.result?.trim();

    if (!description) {
      throw new Error("The AI returned an empty description.");
    }

    return description;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (
      error.name === "AbortError" ||
      message.toLowerCase().includes("canceled")
    ) {
      throw new Error(
        "La IA tardo demasiado. Intenta otra vez con buena luz y espera a que termine Ollama.",
      );
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
