const assert = require("node:assert/strict");
const { test } = require("node:test");
const {
  convertAudioToWav,
  createAiClient,
  createApp,
  MAX_RESPONSE_WORDS,
  SAFE_VISUAL_FALLBACK,
  normalizeAiResponse,
} = require("../app");

const logger = {
  info() {},
  error() {},
};

async function withServer(app, callback) {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  try {
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function jsonPost(body) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function createSilentWav() {
  const sampleRate = 8000;
  const dataLength = 1600;
  const wav = Buffer.alloc(44 + dataLength);

  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataLength, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataLength, 40);

  return wav;
}

test("GET / reports backend health without exposing Express", async () => {
  const app = createApp({
    askOllama: async () => "unused",
    transcribeAudio: async () => "unused",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.has("x-powered-by"), false);
    assert.deepEqual(await response.json(), {
      message: "Veria backend running",
    });
  });
});

test("POST /analyze rejects a missing image", async () => {
  const app = createApp({
    askOllama: async () => "unused",
    transcribeAudio: async () => "unused",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analyze`, jsonPost({}));
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), { error: "No image uploaded" });
  });
});

test("POST /analyze returns the Ollama result", async () => {
  let receivedImage;
  const app = createApp({
    askOllama: async (prompt, image) => {
      assert.match(prompt, /discapacidad visual/);
      receivedImage = image;
      return "Hay una puerta enfrente.";
    },
    transcribeAudio: async () => "unused",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/analyze`,
      jsonPost({ imageBase64: "image-data" }),
    );
    assert.equal(response.status, 200);
    assert.equal(receivedImage, "image-data");
    assert.deepEqual(await response.json(), {
      result: "Hay una puerta enfrente.",
    });
  });
});

test("POST /analyze maps an Ollama failure to 502", async () => {
  const app = createApp({
    askOllama: async () => {
      throw new Error("connection refused");
    },
    transcribeAudio: async () => "unused",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/analyze`,
      jsonPost({ imageBase64: "image-data" }),
    );
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: "No se pudo obtener una respuesta de Ollama.",
    });
  });
});

test("POST /analyze-voice requires audio and image", async () => {
  const app = createApp({
    askOllama: async () => "unused",
    transcribeAudio: async () => "unused",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/analyze-voice`,
      jsonPost({ audioBase64: "audio" }),
    );
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "Falta el audio o la imagen.",
    });
  });
});

test("POST /analyze-voice rejects an empty transcription", async () => {
  const app = createApp({
    askOllama: async () => "unused",
    transcribeAudio: async () => "   ",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/analyze-voice`,
      jsonPost({ audioBase64: "audio", imageBase64: "image" }),
    );
    assert.equal(response.status, 422);
    assert.deepEqual(await response.json(), {
      error: "No se entendio la instruccion.",
    });
  });
});

test("POST /analyze-voice passes transcription and image to Ollama", async () => {
  let receivedPrompt;
  let receivedImage;
  const app = createApp({
    transcribeAudio: async (audio) => {
      assert.equal(audio, "audio-data");
      return "busca mis llaves";
    },
    askOllama: async (prompt, image) => {
      receivedPrompt = prompt;
      receivedImage = image;
      return "Las llaves estan sobre la mesa.";
    },
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/analyze-voice`,
      jsonPost({
        audioBase64: "audio-data",
        imageBase64: "image-data",
      }),
    );
    assert.equal(response.status, 200);
    assert.match(receivedPrompt, /busca mis llaves/);
    assert.match(receivedPrompt, /pide mover la camara/);
    assert.match(receivedPrompt, /no digas que no puedes ayudar/);
    assert.equal(receivedImage, "image-data");
    assert.deepEqual(await response.json(), {
      transcription: "busca mis llaves",
      result: "Las llaves estan sobre la mesa.",
    });
  });
});

test("POST /analyze-voice accepts an M4A file without Base64 conversion", async () => {
  let receivedAudio;
  const app = createApp({
    transcribeAudio: async (audio) => {
      receivedAudio = audio;
      return "busca mis llaves";
    },
    askOllama: async () => "Las llaves estan sobre la mesa.",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const form = new FormData();
    form.append(
      "audio",
      new Blob([Buffer.from("audio-data")], { type: "audio/mp4" }),
      "command.m4a",
    );
    form.append("imageBase64", "image-data");

    const response = await fetch(`${baseUrl}/analyze-voice`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 200);
    assert.equal(Buffer.isBuffer(receivedAudio), true);
    assert.equal(receivedAudio.toString(), "audio-data");
    assert.deepEqual(await response.json(), {
      transcription: "busca mis llaves",
      result: "Las llaves estan sobre la mesa.",
    });
  });
});

test("POST /analyze-voice rejects a non-audio multipart file", async () => {
  const app = createApp({
    transcribeAudio: async () => "unused",
    askOllama: async () => "unused",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const form = new FormData();
    form.append(
      "audio",
      new Blob([Buffer.from("not-audio")], { type: "text/plain" }),
      "command.txt",
    );
    form.append("imageBase64", "image-data");

    const response = await fetch(`${baseUrl}/analyze-voice`, {
      method: "POST",
      body: form,
    });

    assert.equal(response.status, 415);
    assert.deepEqual(await response.json(), {
      error: "El archivo enviado no es una grabacion de audio.",
    });
  });
});

test("POST /analyze-voice maps a Whisper failure to 502", async () => {
  const app = createApp({
    askOllama: async () => "unused",
    transcribeAudio: async () => {
      throw new Error("Whisper unavailable");
    },
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl}/analyze-voice`,
      jsonPost({ audioBase64: "audio", imageBase64: "image" }),
    );
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: "No se pudo transcribir o analizar la instruccion de voz.",
    });
  });
});

test("invalid JSON produces a controlled 400 response", async () => {
  const app = createApp({
    askOllama: async () => "unused",
    transcribeAudio: async () => "unused",
    logger,
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: "El cuerpo JSON no es valido.",
    });
  });
});

test("AI client sends the configured model and validates Ollama output", async () => {
  let request;
  const axiosClient = {
    async post(url, body, options) {
      request = { url, body, options };
      return { data: { message: { content: " respuesta " } } };
    },
  };
  const client = createAiClient({
    axiosClient,
    fetchImpl: async () => {
      throw new Error("unused");
    },
    ollamaUrl: "http://ollama.test/api/chat",
    model: "vision-test",
  });

  const result = await client.askOllama("describe", "image", undefined);
  assert.equal(result, "respuesta");
  assert.equal(request.url, "http://ollama.test/api/chat");
  assert.equal(request.body.model, "vision-test");
  assert.equal(request.body.stream, false);
  assert.equal(request.body.messages[0].role, "system");
  assert.deepEqual(request.body.messages[1].images, ["image"]);
});

test("AI client sends M4A audio to Whisper and trims its text", async () => {
  let request;
  let audioBeforeConversion;
  const client = createAiClient({
    axiosClient: { post: async () => ({}) },
    convertAudio: async (audio) => {
      audioBeforeConversion = audio;
      return Buffer.from("wav-audio");
    },
    fetchImpl: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        async json() {
          return { text: " busca mis llaves " };
        },
      };
    },
    whisperUrl: "http://whisper.test/inference",
  });

  const result = await client.transcribeAudio(
    Buffer.from("audio").toString("base64"),
  );
  assert.equal(result, "busca mis llaves");
  assert.equal(request.url, "http://whisper.test/inference");
  assert.equal(request.options.method, "POST");
  assert.equal(audioBeforeConversion.toString(), "audio");
  assert.equal(request.options.body.get("language"), "es");
  assert.equal(request.options.body.get("response_format"), "json");
  assert.equal(request.options.body.get("file").type, "audio/wav");
  assert.equal(request.options.body.get("file").name, "command.wav");
});

test("FFmpeg normalizes audio to the WAV format required by Whisper", async () => {
  const wav = await convertAudioToWav(createSilentWav());

  assert.equal(wav.subarray(0, 4).toString(), "RIFF");
  assert.equal(wav.subarray(8, 12).toString(), "WAVE");
  assert.equal(wav.readUInt16LE(22), 1);
  assert.equal(wav.readUInt32LE(24), 16000);
  assert.equal(wav.readUInt16LE(34), 16);
});

test("AI responses are normalized and limited to 25 words", () => {
  const longResponse = Array.from(
    { length: 30 },
    (_, index) => `word${index}`,
  ).join(" ");
  const normalized = normalizeAiResponse(`  ${longResponse}\n`);

  assert.equal(normalized.split(" ").length, MAX_RESPONSE_WORDS);
  assert.match(normalized, /\.$/);
  assert.equal(normalizeAiResponse(" respuesta breve "), "respuesta breve");
});

test("AI refusals are replaced with safe visual guidance", () => {
  assert.equal(
    normalizeAiResponse(
      "Lo siento, como asistente no puedo encontrar objetos fisicos.",
    ),
    SAFE_VISUAL_FALLBACK,
  );
});
