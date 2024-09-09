import { readFileSync } from "fs";
import { parseArgs } from "node:util";

import CLIError from "./CLIError.ts";
import type { Configuration } from "./types.ts";
import { fileURLToPath } from "node:url";

const OPTIONS = {
  "after-context": {
    type: "string",
    short: "A",
    description:
      "print <num> lines of trailing context after the selected line",
  },
  "before-context": {
    type: "string",
    short: "B",
    description:
      "print <num> lines of leading context before the selected line",
  },
  context: {
    type: "string",
    short: "C",
    description:
      "print <num> lines of leading and trailing context surrounding the selected line",
    default: "5",
  },
  "no-source-map": {
    type: "boolean",
    description: "don't try to use a source map",
    default: false,
  },
  debug: {
    type: "boolean",
    short: "d",
    description: "output extra debugging",
    default: false,
  },
  version: {
    type: "boolean",
    short: "V",
    description: "output the version number",
    default: false,
  },
  help: {
    type: "boolean",
    short: "h",
    description: "output usage information",
    default: false,
  },
} as const;

export default function parseArguments(
  args = process.argv.slice(2),
): Configuration {
  const parseArgsConfig = {
    args,
    options: OPTIONS,
    allowPositionals: true,
  } as const;
  let parseArgsResult: ReturnType<typeof parseArgs<typeof parseArgsConfig>>;
  try {
    parseArgsResult = parseArgs(parseArgsConfig);
  } catch (error) {
    if (error instanceof Error) {
      throw new CLIError(error.message);
    }
    throw error;
  }

  const { values, positionals } = parseArgsResult;

  if (values.version) {
    const pkg = getPackageInfos();
    console.log(pkg.version);
    process.exit(0);
  }

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  const arg = positionals[0];
  if (!arg) {
    printHelp();
    process.exit(1);
  }

  const matches = /^(.*):(\d+):(\d+)$/.exec(arg);
  if (!matches) {
    printHelp();
    process.exit(1);
  }

  const [, sourceURL, line, column] = matches;

  const beforeContext = parseInteger(
    values["before-context"] !== undefined
      ? values["before-context"]
      : values.context!,
  );
  const afterContext = parseInteger(
    values["after-context"] !== undefined
      ? values["after-context"]
      : values.context!,
  );

  return {
    debug: values.debug!,
    sourceURL,
    position: { line: Number(line), column: Number(column) },
    beforeContext,
    afterContext,
    useSourceMap: !values["no-source-map"]!,
  };
}

function printHelp() {
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
  console.log(message);
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

function parseInteger(s: string): number {
  const n = Number(s);
  if ((n | 0) !== n || n < 0) {
    throw new CLIError(
      `${s} should be a positive integer. Use --help for help.`,
    );
  }
  return n;
}
