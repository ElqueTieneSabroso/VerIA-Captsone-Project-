const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const prettierConfig = require("eslint-config-prettier/flat");

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      "backend/node_modules/**",
      "node_modules/**",
      "whisper/**",
      "logs/**",
    ],
  },
  {
    files: ["backend/**/*.js", "dbconfig/**/*.js"],
    languageOptions: {
      globals: {
        AbortController: "readonly",
        Blob: "readonly",
        Buffer: "readonly",
        FormData: "readonly",
        console: "readonly",
        fetch: "readonly",
        globalThis: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        __dirname: "readonly",
      },
    },
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: {
        AbortController: "readonly",
        beforeEach: "readonly",
        describe: "readonly",
        expect: "readonly",
        jest: "readonly",
        test: "readonly",
      },
    },
  },
]);
