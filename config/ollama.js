// EXPO_PUBLIC_BACKEND_URL=http://192.168.1.12:3000
export const BACKEND_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.1.11:3000";

export const ANALYZE_ENDPOINT = `${BACKEND_BASE_URL}/analyze`;
export const VOICE_ANALYZE_ENDPOINT = `${BACKEND_BASE_URL}/analyze-voice`;
