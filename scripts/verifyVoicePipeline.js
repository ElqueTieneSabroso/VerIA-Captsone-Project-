const fs = require("node:fs");
const path = require("node:path");

const workspaceRoot = path.resolve(__dirname, "..");
const backendUrl =
  process.env.VOICE_TEST_URL || "http://127.0.0.1:3000/analyze-voice";
const audioPath = process.env.VOICE_TEST_AUDIO;
const imagePath =
  process.env.VOICE_TEST_IMAGE ||
  path.join(workspaceRoot, "assets", "ICON_CAMERA.png");

async function main() {
  if (!audioPath) {
    throw new Error(
      "Define VOICE_TEST_AUDIO con la ruta de un archivo M4A de prueba.",
    );
  }

  const form = new FormData();
  const audio = fs.readFileSync(audioPath);
  const imageBase64 = fs.readFileSync(imagePath).toString("base64");

  form.append("audio", new Blob([audio], { type: "audio/mp4" }), "command.m4a");
  form.append("imageBase64", imageBase64);

  const startedAt = performance.now();
  const response = await fetch(backendUrl, { method: "POST", body: form });
  const elapsedMs = Math.round(performance.now() - startedAt);
  const body = await response.json();

  console.log(
    JSON.stringify(
      {
        status: response.status,
        elapsedMs,
        transcription: body.transcription,
        result: body.result,
        error: body.error,
      },
      null,
      2,
    ),
  );

  if (!response.ok || !body.transcription || !body.result) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
