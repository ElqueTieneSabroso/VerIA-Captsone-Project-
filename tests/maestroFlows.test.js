const fs = require("node:fs");
const path = require("node:path");

const workspaceRoot = path.resolve(__dirname, "..");
const YAML = require(
  path.join(workspaceRoot, "node_modules/yaml/dist/index.js"),
);
const maestroDirectory = path.join(workspaceRoot, ".maestro");
const flowFiles = fs
  .readdirSync(maestroDirectory)
  .filter((fileName) => fileName.endsWith(".yaml"))
  .sort();
const sourceFiles = [
  "screens/Welcome.jsx",
  "screens/Login.jsx",
  "screens/SignIn.jsx",
  "screens/CameraScreen.jsx",
  "screens/Settings.jsx",
  "screens/Accessibility.jsx",
  "screens/Interface.jsx",
  "screens/feedback.jsx",
];
const sourceText = sourceFiles
  .map((fileName) =>
    fs.readFileSync(path.join(workspaceRoot, fileName), "utf8"),
  )
  .join("\n");

function parseFlow(fileName) {
  const source = fs.readFileSync(path.join(maestroDirectory, fileName), "utf8");
  const documents = YAML.parseAllDocuments(source);
  const errors = documents.flatMap((document) => document.errors);

  if (errors.length > 0) {
    throw new Error(
      `${fileName}: ${errors.map((error) => error.message).join("; ")}`,
    );
  }

  return {
    config: documents[0]?.toJS(),
    commands: documents[1]?.toJS(),
    source,
  };
}

function collectSelectorIds(value, ids = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSelectorIds(item, ids));
    return ids;
  }

  if (!value || typeof value !== "object") {
    return ids;
  }

  for (const [key, child] of Object.entries(value)) {
    if (key === "id" && typeof child === "string") {
      ids.push(child);
    } else {
      collectSelectorIds(child, ids);
    }
  }

  return ids;
}

describe("contrato de automatización Maestro", () => {
  test("todos los flujos son YAML válido con configuración y comandos", () => {
    expect(flowFiles.length).toBeGreaterThanOrEqual(4);

    for (const fileName of flowFiles) {
      const { config, commands } = parseFlow(fileName);
      expect(config).toEqual(
        expect.objectContaining({
          appId: "host.exp.exponent",
          name: expect.any(String),
        }),
      );
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
    }
  });

  test("cada flujo abre la URL de desarrollo parametrizada", () => {
    for (const fileName of flowFiles) {
      const { source } = parseFlow(fileName);
      expect(source).toContain("openLink: ${APP_URL}");
    }
  });

  test("todos los selectores id usados por Maestro existen como testID", () => {
    const selectorIds = flowFiles.flatMap((fileName) =>
      collectSelectorIds(parseFlow(fileName).commands),
    );

    expect(selectorIds.length).toBeGreaterThan(0);
    for (const selectorId of new Set(selectorIds)) {
      expect(sourceText).toContain(`testID="${selectorId}"`);
    }
  });

  test("los flujos no dependen de coordenadas de pantalla", () => {
    for (const fileName of flowFiles) {
      const { source } = parseFlow(fileName);
      expect(source).not.toMatch(/\bpoint\s*:/);
    }
  });
});
