const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
const MAX_JSON_BODY = "12mb";

app.use(cors());
app.use(express.json({ limit: MAX_JSON_BODY }));

const OLLAMA_URL = "http://127.0.0.1:11434/api/chat";
const MODEL = "minicpm-v:latest";

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

    const ollamaResponse = await axios.post(
      OLLAMA_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content:
              "You are an AI whose purpose is to help visually impaired people understand what you can see in a picture and as such your response must be short and straight to the point, avoiding unnecesary details, prioritize concise and quick answers as to not waste time and focus on describing individual objects. If the image provided contains objects that are close to each other explain how they work as a system for example: 'the water bottle is behind a pencil case', in the case that you are not completely sure of the item youre seeing you may describe it briefly for example: 'There is a red bottle of indistinct contents' and you may add a small 'could be...' if necessary. Maximum 25 words short and to the point tone, Answer in Spanish.",
            images: [imageBase64],
          },
        ],
        stream: false,
      },
      { signal: controller.signal },
    );

    if (controller.signal.aborted) {
      return;
    }

    res.json({
      result: ollamaResponse.data.message.content,
    });
  } catch (error) {
    if (controller.signal.aborted || axios.isCancel(error)) {
      console.log("AI request canceled by client");
      return;
    }

    console.error("AI error:", error.message);

    res.status(500).json({
      error: "Error analyzing image",
    });
  }
});

app.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      error: "Image too large. Try again with a lower resolution capture.",
    });
  }

  return next(error);
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Veria backend running on http://0.0.0.0:3000");
});
