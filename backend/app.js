const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const { spawn } = require("node:child_process");

const MAX_JSON_BODY = "12mb";
const MAX_AUDIO_FILE_BYTES = 12 * 1024 * 1024;
const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const DEFAULT_MODEL = "minicpm-v:latest";
const DEFAULT_WHISPER_URL = "http://127.0.0.1:8080/inference";
const MAX_RESPONSE_WORDS = 25;
const REFUSAL_PATTERN =
  /\b(lo siento|no puedo|no soy capaz|como (?:un )?asistente|no tengo (?:la )?capacidad)\b/i;
const SAFE_VISUAL_FALLBACK =
  "No hay suficiente informacion visual. Mueve la camara lentamente para revisar el entorno.";
const SYSTEM_PROMPT =
  "Eres un asistente visual para personas con baja vision. Responde solamente en espanol, sin presentarte, disculparte ni explicar tus limitaciones. Describe solo lo observable. Se directo, util y breve. Nunca excedas 25 palabras.";
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_AUDIO_FILE_BYTES,
    fieldSize: MAX_AUDIO_FILE_BYTES,
    files: 1,
  },
});

function createAbortError() {
  const error = new Error("Audio conversion canceled.");
  error.name = "AbortError";
  return error;
}

function convertAudioToWav(
  audio,
  signal,
  { spawnImpl = spawn, ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg" } = {},
) {
  return new Promise((resolve, reject) => {
    const child = spawnImpl(
      ffmpegPath,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-t",
        "30",
        "-vn",
        "-ac",
        "1",
        "-ar",
        "16000",
        "-c:a",
        "pcm_s16le",
        "-f",
        "wav",
        "pipe:1",
      ],
      { windowsHide: true },
    );
    const output = [];
    const errors = [];
    let settled = false;

    const finish = (callback, value) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", abortConversion);
      callback(value);
    };
    const abortConversion = () => {
      child.kill();
      finish(reject, createAbortError());
    };

    child.stdout.on("data", (chunk) => output.push(chunk));
    child.stderr.on("data", (chunk) => errors.push(chunk));
    child.stdin.on("error", () => {
      // FFmpeg puede cerrar stdin antes de emitir su error de salida.
    });
    child.once("error", (error) => {
      finish(reject, new Error(`No se pudo iniciar FFmpeg: ${error.message}`));
    });
    child.once("close", (code) => {
      if (code !== 0) {
        const detail = Buffer.concat(errors).toString().trim();
        finish(
          reject,
          new Error(
            `FFmpeg no pudo convertir la grabacion${detail ? `: ${detail}` : "."}`,
          ),
        );
        return;
      }

      const wav = Buffer.concat(output);
      if (!wav.length) {
        finish(reject, new Error("FFmpeg genero un audio WAV vacio."));
        return;
      }
      finish(resolve, wav);
    });

    if (signal?.aborted) {
      abortConversion();
      return;
    }

    signal?.addEventListener("abort", abortConversion, { once: true });
    child.stdin.end(audio);
  });
}

function normalizeAiResponse(value, maxWords = MAX_RESPONSE_WORDS) {
  const normalized = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (REFUSAL_PATTERN.test(normalized)) {
    return SAFE_VISUAL_FALLBACK;
  }
  const words = normalized.split(" ").filter(Boolean);

  if (words.length <= maxWords) {
    return normalized;
  }

  const truncated = words.slice(0, maxWords).join(" ");
  return /[.!?]$/.test(truncated) ? truncated : `${truncated}.`;
}

function createAiClient({
  axiosClient = axios,
  fetchImpl = globalThis.fetch,
  ollamaUrl = process.env.OLLAMA_URL || DEFAULT_OLLAMA_URL,
  model = process.env.OLLAMA_MODEL || DEFAULT_MODEL,
  whisperUrl = process.env.WHISPER_URL || DEFAULT_WHISPER_URL,
  convertAudio = convertAudioToWav,
} = {}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("This backend requires a Node version with fetch support.");
  }

  async function askOllama(content, imageBase64, signal) {
    const message = { role: "user", content };

    if (imageBase64) {
      message.images = [imageBase64];
    }

    const response = await axiosClient.post(
      ollamaUrl,
      {
        model,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, message],
        stream: false,
      },
      { signal },
    );
    const result = normalizeAiResponse(response?.data?.message?.content);

    if (!result) {
      throw new Error("Ollama returned an empty response.");
    }

    return result;
  }

  async function transcribeAudio(audioInput, signal) {
    const form = new FormData();
    const audio = Buffer.isBuffer(audioInput)
      ? audioInput
      : Buffer.from(audioInput, "base64");
    const wavAudio = await convertAudio(audio, signal);

    form.append(
      "file",
      new Blob([wavAudio], { type: "audio/wav" }),
      "command.wav",
    );
    form.append("language", "es");
    form.append("response_format", "json");

    const response = await fetchImpl(whisperUrl, {
      method: "POST",
      body: form,
      signal,
    });

    if (!response.ok) {
      throw new Error(
        `Whisper error (${response.status}): ${await response.text()}`,
      );
    }

    const data = await response.json();
    return (data.text || data.transcription || "").trim();
  }

  return { askOllama, transcribeAudio };
}

function createApp({
  askOllama,
  transcribeAudio,
  logger = console,
  corsOptions,
} = {}) {
  const aiClient =
    askOllama && transcribeAudio
      ? { askOllama, transcribeAudio }
      : createAiClient();
  const app = express();

  app.disable("x-powered-by");
  app.use(cors(corsOptions));
  app.use(express.json({ limit: MAX_JSON_BODY }));

  app.get("/", (req, res) => {
    res.json({ message: "Veria backend running" });
  });

  app.post("/analyze", async (req, res) => {
    const controller = new AbortController();

    res.on("close", () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    try {
      const imageBase64 = req.body?.imageBase64;

      if (!imageBase64) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const result = await aiClient.askOllama(
        "Ayuda a una persona con discapacidad visual. Describe la imagen en espanol, de forma directa y en maximo 25 palabras. Indica objetos y sus posiciones relativas.",
        imageBase64,
        controller.signal,
      );

      if (controller.signal.aborted) {
        return undefined;
      }

      return res.json({ result });
    } catch (error) {
      if (controller.signal.aborted || axios.isCancel(error)) {
        logger.info("AI request canceled by client");
        return undefined;
      }

      logger.error("AI error:", error.message);
      return res.status(502).json({
        error: "No se pudo obtener una respuesta de Ollama.",
      });
    }
  });

  app.post("/analyze-voice", voiceUpload.single("audio"), async (req, res) => {
    const controller = new AbortController();
    res.on("close", () => !res.writableEnded && controller.abort());

    try {
      const imageBase64 = req.body?.imageBase64;
      const audioInput = req.file?.buffer || req.body?.audioBase64;

      if (req.file && !req.file.mimetype?.startsWith("audio/")) {
        return res
          .status(415)
          .json({ error: "El archivo enviado no es una grabacion de audio." });
      }

      if (!audioInput || !imageBase64) {
        return res.status(400).json({ error: "Falta el audio o la imagen." });
      }

      const transcription = (
        await aiClient.transcribeAudio(audioInput, controller.signal)
      )?.trim();
      if (!transcription) {
        return res
          .status(422)
          .json({ error: "No se entendio la instruccion." });
      }

      const result = await aiClient.askOllama(
        `Ayuda a una persona con discapacidad visual usando la imagen. Sigue esta instruccion: "${transcription}". Responde en espanol, de forma directa y en maximo 25 palabras. Si el objeto no aparece, indicalo y pide mover la camara; no digas que no puedes ayudar.`,
        imageBase64,
        controller.signal,
      );

      return res.json({ transcription, result });
    } catch (error) {
      if (controller.signal.aborted || axios.isCancel(error)) {
        return undefined;
      }

      logger.error("Voice analysis error:", error.message);
      return res.status(502).json({
        error: "No se pudo transcribir o analizar la instruccion de voz.",
      });
    }
  });

  app.use((error, req, res, next) => {
    if (
      error.type === "entity.too.large" ||
      (error instanceof multer.MulterError &&
        ["LIMIT_FILE_SIZE", "LIMIT_FIELD_VALUE"].includes(error.code))
    ) {
      return res.status(413).json({
        error: "La imagen o el audio exceden el limite permitido de 12 MB.",
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        error: "El formulario de audio no es valido.",
      });
    }

    if (error instanceof SyntaxError && error.status === 400) {
      return res.status(400).json({ error: "El cuerpo JSON no es valido." });
    }

    return next(error);
  });

  return app;
}

module.exports = {
  convertAudioToWav,
  createAiClient,
  createApp,
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_URL,
  DEFAULT_WHISPER_URL,
  MAX_RESPONSE_WORDS,
  SAFE_VISUAL_FALLBACK,
  normalizeAiResponse,
};
