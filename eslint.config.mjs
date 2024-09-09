// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config({
  ignores: ["main.js"],
  extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
  rules: {
    "@typescript-eslint/consistent-type-imports": "error",
  },
});
