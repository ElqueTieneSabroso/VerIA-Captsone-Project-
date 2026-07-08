const db = require("../dbconfig/db");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");

exports.login = async (req,res)=>{ 
    console.log("LOGIN RECIBIDO");
    console.log(req.body);
    const {correo,contrasena} = req.body;
    if(!correo || !contrasena){
        return res.status(400).json({
            mensaje:"Todos los campos son obligatorios"
        });
    }
    try{
        const [usuario] = await db.query(
            "SELECT * FROM Usuarios WHERE Correo=?",
            [correo]
        );
        if(usuario.length==0){
            return res.status(404).json({
                mensaje:"Usuario no encontrado"
            });
        }
        const valido = await bcrypt.compare(
            contrasena,
            usuario[0].Contrasena
        );
        if(!valido){
            return res.status(401).json({
                mensaje:"Contraseña incorrecta"
            });
        }
        res.json({
            mensaje:"Inicio de sesión correcto",
            usuario:usuario[0]
        });
    }
catch (error) {
    console.log("=========== ERROR LOGIN ===========");
    console.log(error);
    console.log("CODE:", error.code);
    console.log("MESSAGE:", error.message);
    console.log("SQL:", error.sql);
    console.log("SQL MESSAGE:", error.sqlMessage);
    console.log("STACK:", error.stack);
    console.log("==================================");

    res.status(500).json({
        mensaje: "Error del servidor"
    });
}
};
exports.register = async (req, res) => {

    console.log("REGISTER RECIBIDO");
    console.log(req.body);

    const { nombre, correo, contrasena } = req.body;

    if (!nombre || !correo || !contrasena) {
        return res.status(400).json({
            mensaje: "Todos los campos son obligatorios"
        });
    }

    try {

        const [usuario] = await db.query(
            "SELECT * FROM Usuarios WHERE Correo = ?",
            [correo]
        );

        if (usuario.length > 0) {
            return res.status(409).json({
                mensaje: "Ese correo ya está registrado."
            });
        }

        const hash = await bcrypt.hash(contrasena, 10);

        await db.query(
            `INSERT INTO Usuarios
            (Nombre, Correo, Contrasena)
            VALUES (?, ?, ?)`,
            [nombre, correo, hash]
        );

        res.status(201).json({
            mensaje: "Usuario registrado correctamente."
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "Error del servidor."
        });

    }
};