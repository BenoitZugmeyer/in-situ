module.exports = {
  extends: ["benoitz-prettier"],
  rules: {
    "no-console": "off",
  },
  env: {
    node: true,
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
