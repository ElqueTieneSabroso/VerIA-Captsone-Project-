/Every time you restart your PC, you'll need to run these two commands:// Terminal 1: Start Ollama with CORS
// $env:OLLAMA_ORIGINS="*"; $env:OLLAMA_HOST="0.0.0.0:11434"; ollama serve

// Terminal 2: Start ngrok tunnel
// .\ngrok-bin\ngrok.exe http --url=stratus-catty-trump.ngrok-free.dev 11434
