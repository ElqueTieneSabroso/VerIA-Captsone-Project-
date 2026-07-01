const { body } = require("express-validator");

exports.registerValidation = [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio"),
    body("correo").isEmail().withMessage("Correo inválido"),
    body("contrasena").isStrongPassword({minLength:8,minLowercase:1,minUppercase:1,minNumbers:1}).withMessage("La contraseña no es segura")
];

