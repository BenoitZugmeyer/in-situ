#!/usr/bin/env node

import { buildSync } from "esbuild";
import { readFileSync } from "fs";

const { dependencies } = JSON.parse(readFileSync("package.json", "utf-8"));

buildSync({
  entryPoints: ["./src/main"],
  bundle: true,
  platform: "node",
  target: ["node16"],
  outfile: "main.cjs",
  external: Object.keys(dependencies),
});
