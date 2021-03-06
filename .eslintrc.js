module.exports = {
  extends: ["benoitz-prettier"],
  rules: {
    "no-console": "off",
  },
  env: {
    node: true,
  },
  parserOptions: {
    ecmaVersion: 9,
  },
  overrides: [
    {
      files: ["**/*.test.js"],
      env: {
        jest: true,
      },
    },
  ],
}
