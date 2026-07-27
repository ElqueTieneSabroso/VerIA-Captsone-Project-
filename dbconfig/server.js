const express = require("express");
const cors = require("cors");
const auth = require("./auth");
const app = express();

app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

app.use("/api/auth", auth);

app.get("/", (req, res) => {
  res.send("Servidor funcionando");
});
if (require.main === module) {
  const port = Number(process.env.AUTH_PORT) || 3001;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Servidor iniciado en http://0.0.0.0:${port}`);
  });
}

module.exports = app;
