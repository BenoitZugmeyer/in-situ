import { parseArgs } from "node:util";

import CLIError from "./CLIError.ts";
import type { Configuration } from "./types.ts";

export const OPTIONS = {
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

type ParseArgumentsResult =
  | {
      command: "version";
    }
  | {
      command: "help";
    }
  | {
      command: "context";
      configuration: Configuration;
    };

export default function parseArguments(args: string[]): ParseArgumentsResult {
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
    return { command: "version" };
  }

  if (values.help) {
    return { command: "help" };
  }

  const arg = positionals[0];
  if (!arg) {
    throw new CLIError(
      "Missing positional argument URL:LINE:COLUMN. Use --help for documentation.",
    );
  }

  const matches = /^(.*):(\d+):(\d+)$/.exec(arg);
  if (!matches) {
    throw new CLIError(
      `Invalid positional argument ${arg}. Use --help for documentation.`,
    );
  }

  const [, sourceURL, line, column] = matches;

  return {
    command: "context",
    configuration: {
      debug: values.debug!,
      sourceURL,
      location: { line: Number(line), column: Number(column) },
      beforeContext: parseInteger(values["before-context"] ?? values.context),
      afterContext: parseInteger(values["after-context"] ?? values.context),
      useSourceMap: !values["no-source-map"]!,
    },
  };
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
