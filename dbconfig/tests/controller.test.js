const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createAuthController, publicUser } = require("../controller");

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const logger = {
  error() {},
};

test("publicUser removes every common password field", () => {
  assert.deepEqual(
    publicUser({
      Id: 7,
      Correo: "test@example.com",
      Contrasena: "hash",
      password: "other-hash",
    }),
    { Id: 7, Correo: "test@example.com" },
  );
});

test("login validates required fields and email format", async () => {
  const controller = createAuthController({
    database: { query: async () => assert.fail("database should not run") },
    logger,
  });

  const missing = createResponse();
  await controller.login({ body: {} }, missing);
  assert.equal(missing.statusCode, 400);

  const invalid = createResponse();
  await controller.login(
    { body: { correo: "invalid", contrasena: "Password1!" } },
    invalid,
  );
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.body.mensaje, "Correo invalido");
});

test("login returns 404 when the user does not exist", async () => {
  const controller = createAuthController({
    database: { query: async () => [[]] },
    logger,
  });
  const response = createResponse();

  await controller.login(
    { body: { correo: "test@example.com", contrasena: "Password1!" } },
    response,
  );
  assert.equal(response.statusCode, 404);
});

test("login returns 401 for a bad password", async () => {
  const controller = createAuthController({
    database: {
      query: async () => [[{ Correo: "test@example.com", Contrasena: "hash" }]],
    },
    passwordService: { compare: async () => false },
    logger,
  });
  const response = createResponse();

  await controller.login(
    { body: { correo: "test@example.com", contrasena: "Wrong1!" } },
    response,
  );
  assert.equal(response.statusCode, 401);
});

test("successful login never returns the password hash", async () => {
  const controller = createAuthController({
    database: {
      query: async () => [
        [
          {
            Id: 1,
            Nombre: "Ada",
            Correo: "ada@example.com",
            Contrasena: "secret-hash",
          },
        ],
      ],
    },
    passwordService: { compare: async () => true },
    logger,
  });
  const response = createResponse();

  await controller.login(
    { body: { correo: "ada@example.com", contrasena: "Password1!" } },
    response,
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.usuario.Contrasena, undefined);
  assert.deepEqual(response.body.usuario, {
    Id: 1,
    Nombre: "Ada",
    Correo: "ada@example.com",
  });
});

test("register validates email and password before querying MySQL", async () => {
  const controller = createAuthController({
    database: { query: async () => assert.fail("database should not run") },
    logger,
  });

  const invalidEmail = createResponse();
  await controller.register(
    {
      body: {
        nombre: "Ada",
        correo: "invalid",
        contrasena: "Password1!",
      },
    },
    invalidEmail,
  );
  assert.equal(invalidEmail.statusCode, 400);

  const weakPassword = createResponse();
  await controller.register(
    {
      body: {
        nombre: "Ada",
        correo: "ada@example.com",
        contrasena: "weak",
      },
    },
    weakPassword,
  );
  assert.equal(weakPassword.statusCode, 400);
  assert.equal(weakPassword.body.mensaje, "Contrasena insegura");
});

test("register rejects a duplicate email", async () => {
  const controller = createAuthController({
    database: { query: async () => [[{ Id: 1 }]] },
    logger,
  });
  const response = createResponse();

  await controller.register(
    {
      body: {
        nombre: "Ada",
        correo: "ada@example.com",
        contrasena: "Password1!",
      },
    },
    response,
  );
  assert.equal(response.statusCode, 409);
});

test("register hashes the password and inserts the user", async () => {
  const calls = [];
  const database = {
    async query(sql, params) {
      calls.push({ sql, params });
      return calls.length === 1 ? [[]] : [{ affectedRows: 1 }];
    },
  };
  const controller = createAuthController({
    database,
    passwordService: { hash: async () => "safe-hash" },
    logger,
  });
  const response = createResponse();

  await controller.register(
    {
      body: {
        nombre: " Ada ",
        correo: " ada@example.com ",
        contrasena: "Password1!",
      },
    },
    response,
  );

  assert.equal(response.statusCode, 201);
  assert.deepEqual(calls[1].params, ["Ada", "ada@example.com", "safe-hash"]);
});

test("database errors produce a controlled 500 response", async () => {
  const controller = createAuthController({
    database: {
      query: async () => {
        throw new Error("database unavailable");
      },
    },
    logger,
  });
  const response = createResponse();

  await controller.login(
    { body: { correo: "test@example.com", contrasena: "Password1!" } },
    response,
  );
  assert.equal(response.statusCode, 500);
  assert.deepEqual(response.body, { mensaje: "Error del servidor" });
});
