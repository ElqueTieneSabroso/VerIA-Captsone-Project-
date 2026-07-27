const { createApp } = require("./app");

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const app = createApp();

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Veria backend running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
