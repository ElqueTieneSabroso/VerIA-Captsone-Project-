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
  try {
    const imageBase64 = req.body?.imageBase64;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const ollamaResponse = await axios.post(OLLAMA_URL, {
      model: MODEL,
      messages: [
        {
          role: "user",
          content:
            "You are Veria, an accessibility assistant for visually impaired users. Describe the image clearly and briefly. Mention important objects, text, colors, obstacles, and possible risks. Answer in Spanish.",
          images: [imageBase64],
        },
      ],
      stream: false,
    });

    res.json({
      result: ollamaResponse.data.message.content,
    });
  } catch (error) {
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
