#!/usr/bin/env node

import { fileURLToPath } from "node:url";
import { readFileSync } from "fs";

import CLIError from "./CLIError.ts";
import parseArguments, { OPTIONS } from "./parseArguments.ts";
import applyBeautify from "./applyBeautify.ts";
import applySourceMap from "./applySourceMap.ts";
import printContext from "./printContext.ts";
import log from "./log.ts";
import read from "./read.ts";
import type { ApplyResult, Configuration } from "./types.ts";

main().catch((e) => {
  if (e instanceof CLIError) {
    log.error(e.message);
    process.exit(1);
  } else {
    log.error(
      `An unexpected error occurred: ${e instanceof Error ? e.stack : e}`,
    );
  }
});

async function main() {
  const parseArgumentsResult = parseArguments(process.argv.slice(2));
  switch (parseArgumentsResult.command) {
    case "version":
      commanVersion();
      break;
    case "help":
      commandHelp();
      break;
    case "context":
      await commandContext(parseArgumentsResult.configuration);
      break;
    default:
      parseArgumentsResult satisfies never;
  }
}

export function commandHelp() {
  const pkg = getPackageInfos();
  let message = `\
Usage: ${pkg.name} [options] <URL:LINE:COLUMN>

${pkg.description}

Options:`;
  for (const [name, option] of Object.entries(OPTIONS)) {
    let names = "";
    if ("short" in option) {
      names += `-${option.short}, `;
    }
    names += `--${name}`;
    if (option.type === "string") {
      names += " <num>"; // for now, all 'string' types are numbers
    }
    message += `\n  ${names.padEnd(27)} ${option.description}`;
  }
  log.info(message);
}

function commanVersion() {
  log.info(getPackageInfos().version);
}

async function commandContext({
  debug,
  sourceURL,
  location,
  beforeContext,
  afterContext,
  useSourceMap,
}: Configuration) {
  log.debug.disabled = !debug;
  log.status("Fetching source code...");

  let readResult;
  try {
    readResult = await read(sourceURL);
  } catch (e) {
    throw new CLIError(`Failed to fetch source code: ${e}`);
  }

  let applyResult: ApplyResult = {
    type: "unresolved",
  };
  if (useSourceMap) {
    applyResult = await applySourceMap({ readResult, location });
  }
  if (applyResult.type !== "resolved") {
    // TODO: use filename from sourcemaps? is that an actual use case?
    applyResult = await applyBeautify({ readResult, location });
  }
  if (applyResult.type !== "resolved") {
    throw new CLIError("Failed to apply source map or beautify");
  }

  printContext(applyResult, { beforeContext, afterContext });
}

function getPackageInfos() {
  let input;
  for (const path of [
    // When from main.js
    "./package.json",
    // When from src/main.js
    "../package.json",
  ]) {
    try {
      input = readFileSync(fileURLToPath(import.meta.resolve(path)), "utf-8");
      break;
    } catch {
      // continue
    }
  }

  if (!input) {
    throw new CLIError("Cannot find package.json");
  }

  return JSON.parse(input);
}
