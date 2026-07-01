const db = require("../dbconfig/db");
const bcrypt = require("bcrypt");
const { validationResult } = require("express-validator");
exports.register = async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty()){return res.status(400).json(errors.array());}

    const {nombre,correo,contrasena} = req.body;
    try{
        const [usuario] = await db.query("SELECT * FROM Usuarios WHERE Correo=?",[correo]);
        if(usuario.length>0){return res.status(409).json({mensaje:"Ese correo ya existe"});
        }
        const hash = await bcrypt.hash(contrasena,10);
        await db.query(
            `INSERT INTO Usuarios
            (Nombre,Correo,Contrasena)
            VALUES(?,?,?)`,
            [nombre,correo,hash]
        );
        res.status(201).json({mensaje:"Usuario registrado"});
    }
    catch(error){
        console.log(error);
        res.status(500).json({mensaje:"Error del servidor"});
    }
};