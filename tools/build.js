#!/usr/bin/env node

const { dependencies } = require("../package.json")

require("esbuild").buildSync({
  entryPoints: ["./src/main"],
  bundle: true,
  platform: "node",
  target: ["node16"],
  outfile: "main.js",
  external: Object.keys(dependencies),
})
