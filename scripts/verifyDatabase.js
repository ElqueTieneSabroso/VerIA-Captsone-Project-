const database = require("../dbconfig/db");

async function main() {
  const startedAt = performance.now();
  const [[server]] = await database.query(
    "SELECT VERSION() AS version, DATABASE() AS databaseName",
  );
  const [tables] = await database.query("SHOW TABLES");
  const elapsedMs = Math.round(performance.now() - startedAt);

  console.log(
    JSON.stringify(
      {
        connected: true,
        version: server.version,
        databaseConfigured: Boolean(server.databaseName),
        tableCount: tables.length,
        elapsedMs,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          connected: false,
          code: error.code || "UNKNOWN",
          message: error.message,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  })
  .finally(() => database.end());
