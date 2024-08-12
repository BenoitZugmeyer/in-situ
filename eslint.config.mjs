import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["main.js"],
  },
  {
    languageOptions: {
      globals: {
        fetch: "readonly",
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
      },
    },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^_" }],
    },
  },

  {
    files: ["tools/*.js"],
    rules: {
      "no-console": ["off"],
    },
  },

  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: {
        expect: "readonly",
        test: "readonly",
        describe: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
];
