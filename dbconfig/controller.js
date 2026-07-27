const db = require("./db");
const bcrypt = require("bcrypt");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_PATTERN =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

function publicUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }

  const { Contrasena, contrasena, Password, password, ...safeUser } = user;
  return safeUser;
}

function createAuthController({
  database = db,
  passwordService = bcrypt,
  logger = console,
} = {}) {
  async function login(req, res) {
    const correo = req.body?.correo?.trim();
    const contrasena = req.body?.contrasena;

    if (!correo || !contrasena) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    if (!EMAIL_PATTERN.test(correo)) {
      return res.status(400).json({ mensaje: "Correo invalido" });
    }

    try {
      const [usuarios] = await database.query(
        "SELECT * FROM Usuarios WHERE Correo=?",
        [correo],
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ mensaje: "Usuario no encontrado" });
      }

      const valido = await passwordService.compare(
        contrasena,
        usuarios[0].Contrasena,
      );

      if (!valido) {
        return res.status(401).json({ mensaje: "Contrasena incorrecta" });
      }

      return res.json({
        mensaje: "Inicio de sesion correcto",
        usuario: publicUser(usuarios[0]),
      });
    } catch (error) {
      logger.error("Error de base de datos durante login:", error.message);
      return res.status(500).json({ mensaje: "Error del servidor" });
    }
  }

  async function register(req, res) {
    const nombre = req.body?.nombre?.trim();
    const correo = req.body?.correo?.trim();
    const contrasena = req.body?.contrasena;

    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    if (!EMAIL_PATTERN.test(correo)) {
      return res.status(400).json({ mensaje: "Correo invalido" });
    }

    if (!STRONG_PASSWORD_PATTERN.test(contrasena)) {
      return res.status(400).json({ mensaje: "Contrasena insegura" });
    }

    try {
      const [usuarios] = await database.query(
        "SELECT * FROM Usuarios WHERE Correo = ?",
        [correo],
      );

      if (usuarios.length > 0) {
        return res.status(409).json({
          mensaje: "Ese correo ya esta registrado.",
        });
      }

      const hash = await passwordService.hash(contrasena, 10);
      await database.query(
        `INSERT INTO Usuarios
        (Nombre, Correo, Contrasena)
        VALUES (?, ?, ?)`,
        [nombre, correo, hash],
      );

      return res.status(201).json({
        mensaje: "Usuario registrado correctamente.",
      });
    } catch (error) {
      logger.error("Error de base de datos durante registro:", error.message);
      return res.status(500).json({ mensaje: "Error del servidor." });
    }
  }

  return { login, register };
}

const controller = createAuthController();

module.exports = {
  ...controller,
  createAuthController,
  publicUser,
};
