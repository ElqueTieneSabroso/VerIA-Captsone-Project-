import { fetch } from "expo/fetch";
import { login, register } from "../services/auth";

jest.mock("expo/fetch", () => ({ fetch: jest.fn() }));

function response({ ok = true, status = 200, json = {} } = {}) {
  return {
    ok,
    status,
    json: jest.fn().mockResolvedValue(json),
  };
}

beforeEach(() => {
  fetch.mockReset();
});

test("login sends credentials and returns server data", async () => {
  fetch.mockResolvedValue(
    response({ json: { mensaje: "Inicio de sesion correcto" } }),
  );

  await expect(
    login({ correo: "test@example.com", contrasena: "Password1!" }),
  ).resolves.toEqual({ mensaje: "Inicio de sesion correcto" });

  const options = fetch.mock.calls[0][1];
  expect(options.method).toBe("POST");
  expect(JSON.parse(options.body)).toEqual({
    correo: "test@example.com",
    contrasena: "Password1!",
  });
});

test("registration preserves a controlled API error", async () => {
  fetch.mockResolvedValue(
    response({
      ok: false,
      status: 409,
      json: { mensaje: "Ese correo ya esta registrado." },
    }),
  );

  await expect(
    register({
      nombre: "Ada",
      correo: "ada@example.com",
      contrasena: "Password1!",
    }),
  ).rejects.toThrow("Ese correo ya esta registrado.");
});

test("auth service handles a non-JSON error response", async () => {
  fetch.mockResolvedValue({
    ok: false,
    status: 500,
    json: jest.fn().mockRejectedValue(new Error("not json")),
  });

  await expect(
    login({ correo: "test@example.com", contrasena: "Password1!" }),
  ).rejects.toThrow("Error de autenticación (500).");
});

test("auth service converts network failures into a useful message", async () => {
  fetch.mockRejectedValue(new TypeError("Network request failed"));

  await expect(
    login({ correo: "test@example.com", contrasena: "Password1!" }),
  ).rejects.toThrow("No se pudo conectar con el servidor de autenticación.");
});
