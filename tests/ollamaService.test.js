import { fetch } from "expo/fetch";
import {
  analyzeImageWithBackend,
  analyzeVoiceCommandWithBackend,
} from "../services/ollama";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));
jest.mock("expo-file-system", () => ({
  File: jest.fn(),
  UploadType: { MULTIPART: 1 },
}));

const uploadAudio = jest.fn();
const voiceDependencies = {
  createAudioFile: () => ({ upload: uploadAudio }),
};

function response({ ok = true, status = 200, json = {}, text = "" } = {}) {
  return {
    ok,
    status,
    statusText: "",
    json: jest.fn().mockResolvedValue(json),
    text: jest.fn().mockResolvedValue(text),
  };
}

beforeEach(() => {
  fetch.mockReset();
  uploadAudio.mockReset();
});

test("image analysis sends Base64 and returns trimmed text", async () => {
  fetch.mockResolvedValue(
    response({ json: { result: "  Una puerta enfrente.  " } }),
  );

  await expect(analyzeImageWithBackend("image-data")).resolves.toBe(
    "Una puerta enfrente.",
  );
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
    imageBase64: "image-data",
  });
});

test("image analysis reports HTTP failures", async () => {
  fetch.mockResolvedValue(
    response({ ok: false, status: 502, text: "Ollama unavailable" }),
  );

  await expect(analyzeImageWithBackend("image-data")).rejects.toThrow(
    /Image analysis failed \(502\)/,
  );
});

test("voice analysis returns transcription and result", async () => {
  uploadAudio.mockResolvedValue({
    status: 200,
    body: JSON.stringify({
      transcription: " busca mis llaves ",
      result: " estan sobre la mesa ",
    }),
  });

  await expect(
    analyzeVoiceCommandWithBackend(
      "file:///recording.m4a",
      "image",
      undefined,
      voiceDependencies,
    ),
  ).resolves.toEqual({
    transcription: "busca mis llaves",
    result: "estan sobre la mesa",
  });

  expect(uploadAudio).toHaveBeenCalledWith(
    expect.stringMatching(/\/analyze-voice$/),
    expect.objectContaining({
      httpMethod: "POST",
      uploadType: 1,
      fieldName: "audio",
      mimeType: "audio/mp4",
      parameters: { imageBase64: "image" },
    }),
  );
});

test("voice analysis uses the backend error message", async () => {
  uploadAudio.mockResolvedValue({
    status: 422,
    body: JSON.stringify({
      error: "No se entendio la instruccion.",
    }),
  });

  await expect(
    analyzeVoiceCommandWithBackend(
      "file:///recording.m4a",
      "image",
      undefined,
      voiceDependencies,
    ),
  ).rejects.toThrow("No se entendio la instruccion.");
});

test("an external abort is forwarded to the native file upload", async () => {
  const controller = new AbortController();
  uploadAudio.mockImplementation(
    (url, options) =>
      new Promise((resolve, reject) => {
        options.signal.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      }),
  );

  const pending = analyzeVoiceCommandWithBackend(
    "file:///recording.m4a",
    "image",
    controller.signal,
    voiceDependencies,
  );
  controller.abort();

  await expect(pending).rejects.toThrow(/tardaron demasiado/);
  expect(uploadAudio.mock.calls[0][1].signal.aborted).toBe(true);
});

test("voice analysis rejects a missing recording URI before sending", async () => {
  await expect(
    analyzeVoiceCommandWithBackend("", "image", undefined, voiceDependencies),
  ).rejects.toThrow("No se generó el archivo de audio");
  expect(uploadAudio).not.toHaveBeenCalled();
});
