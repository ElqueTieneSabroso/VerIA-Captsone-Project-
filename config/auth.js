const DEFAULT_HOST = "192.168.1.11";

export const AUTH_BASE_URL =
  process.env.EXPO_PUBLIC_AUTH_URL || `http://${DEFAULT_HOST}:3001`;

export const LOGIN_ENDPOINT = `${AUTH_BASE_URL}/api/auth/login`;
export const REGISTER_ENDPOINT = `${AUTH_BASE_URL}/api/auth/register`;
