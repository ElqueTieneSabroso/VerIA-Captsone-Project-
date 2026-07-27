import { fetch } from "expo/fetch";
import { LOGIN_ENDPOINT, REGISTER_ENDPOINT } from "../config/auth";

const AUTH_TIMEOUT_MS = 15_000;

class AuthApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

async function postAuth(endpoint, body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new AuthApiError(
        data?.mensaje || `Error de autenticación (${response.status}).`,
        response.status,
      );
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("El servidor de autenticación tardó demasiado.");
    }

    if (error instanceof AuthApiError) {
      throw error;
    }

    throw new Error("No se pudo conectar con el servidor de autenticación.");
  } finally {
    clearTimeout(timer);
  }
}

export function login(credentials) {
  return postAuth(LOGIN_ENDPOINT, credentials);
}

export function register(user) {
  return postAuth(REGISTER_ENDPOINT, user);
}
