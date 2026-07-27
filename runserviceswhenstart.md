/Every time you restart your PC, you'll need to run these two commands:// Terminal 1: Start Ollama with CORS
// $env:OLLAMA_ORIGINS="\*"; $env:OLLAMA_HOST="0.0.0.0:11434"; ollama serve

// Terminal 2: Start ngrok tunnel
// .\ngrok-bin\ngrok.exe http --url=stratus-catty-trump.ngrok-free.dev 11434

// Voice commands also require a local whisper.cpp server:
// Download a multilingual model such as ggml-small.bin, then run:
// .\whisper-server.exe -m .\models\ggml-small.bin --host 127.0.0.1 --port 8080 -l es
// To use another address, set it before starting the backend:
// $env:WHISPER_URL="http://127.0.0.1:8080/inference"

// Terminal 3: Start the API used by the mobile app
// cd backend
// node index.js
