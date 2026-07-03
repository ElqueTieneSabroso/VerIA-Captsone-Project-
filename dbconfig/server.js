require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./auth");
const auth = require("./auth");
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", auth);

app.get("/", (req, res) => {
    res.send("Servidor funcionando");
});
/* 
app.listen(process.env.PORT, () => {
    console.log("Servidor iniciado");
});
*/
app.listen(3000, "0.0.0.0", () => {
    console.log("Servidor iniciado en http://0.0.0.0:3000");
});
