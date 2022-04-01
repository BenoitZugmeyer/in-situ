#!/usr/bin/env node

const { dependencies } = require("../package.json")
const esbuild = require("esbuild")

Promise.all([
  esbuild.build({
    entryPoints: ["./src/main"],
    bundle: true,
    platform: "node",
    target: ["node16"],
    outfile: "main.js",
    logLevel: "info",
    external: ["./front.js", ...Object.keys(dependencies)],
  }),

  esbuild.build({
    entryPoints: ["./front/main"],
    bundle: true,
    target: ["es2020"],
    logLevel: "info",
    outfile: "front.js",
  }),
]).catch(() => process.exit(1))
