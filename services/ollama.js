import { fetch as expoFetch } from "expo/fetch";
import { File, UploadType } from "expo-file-system";
import { ANALYZE_ENDPOINT, VOICE_ANALYZE_ENDPOINT } from "../config/ollama";

const REQUEST_TIMEOUT_MS = 300_000;

function createRequestController(signal) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abortRequest = () => controller.abort();

  signal?.addEventListener("abort", abortRequest, { once: true });
  if (signal?.aborted) {
    controller.abort();
  }

  return {
    controller,
    cleanup() {
      signal?.removeEventListener("abort", abortRequest);
      clearTimeout(timer);
    },
  };
}

export async function analyzeImageWithBackend(imageBase64, signal) {
  const request = createRequestController(signal);

  try {
    const response = await expoFetch(ANALYZE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64 }),
      signal: request.controller.signal,
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
      error?.name === "AbortError" ||
      message.toLowerCase().includes("canceled")
    ) {
      throw new Error(
        "La IA tardo demasiado. Intenta otra vez con buena luz y espera a que termine Ollama.",
      );
    }
    throw error;
  } finally {
    request.cleanup();
  }
}

export async function analyzeVoiceCommandWithBackend(
  audioUri,
  imageBase64,
  signal,
  { createAudioFile = (uri) => new File(uri) } = {},
) {
  const request = createRequestController(signal);

  try {
    if (!audioUri) {
      throw new Error("No se generó el archivo de audio.");
    }

    const audioFile = createAudioFile(audioUri);
    const response = await audioFile.upload(VOICE_ANALYZE_ENDPOINT, {
      httpMethod: "POST",
      uploadType: UploadType.MULTIPART,
      fieldName: "audio",
      mimeType: "audio/mp4",
      parameters: { imageBase64 },
      signal: request.controller.signal,
    });
    const data = (() => {
      try {
        return JSON.parse(response.body);
      } catch {
        return null;
      }
    })();

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        data?.error || `La instruccion de voz fallo (${response.status}).`,
      );
    }

    const transcription = data?.transcription?.trim();
    const result = data?.result?.trim();

    if (!transcription || !result) {
      throw new Error(
        "No se pudo obtener una instruccion y respuesta validas.",
      );
    }

    return { transcription, result };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "La transcripcion o la IA tardaron demasiado. Intenta nuevamente.",
      );
    }
    throw error;
  } finally {
    request.cleanup();
  }
}
