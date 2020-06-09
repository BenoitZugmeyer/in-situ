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
      files: ["tests/*"],
      env: {
        jest: true,
      },
    },
  ],
}
