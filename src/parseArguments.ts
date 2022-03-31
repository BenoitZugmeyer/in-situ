import commander from "commander";

import CLIError from "./CLIError";
import pkg from "../package.json";
import { Position } from "./types";

type Arguments = {
  debug: boolean;
  sourceURL: string;
  position: Position;
  useSourceMap: boolean;
  beforeContext: number;
  afterContext: number;
};

export default function parseArguments(argv = process.argv): Arguments {
  const program = new commander.Command();
  program.name(pkg.name);
  program.description(pkg.description);
  program.option(
    "-A, --after-context <num>",
    "print <num> lines of trailing context after the selected line",
    parseInteger
  );
  program.option(
    "-B, --before-context <num>",
    "print <num> lines of leading context before the selected line",
    parseInteger
  );
  program.option(
    "-C, --context <num>",
    "print <num> lines of leading and trailing context surrounding the selected line",
    parseInteger
  );
  program.option("--no-source-map", "don't try to use a source map");
  program.option("-d, --debug", "output extra debugging");
  program.version(pkg.version);
  program.arguments("<URL:LINE:COLUMN>");
  program.parse(argv);

  const arg = program.args[0];
  if (!arg) program.help();

  const matches = /^(.*):(\d+):(\d+)$/.exec(arg);
  if (!matches) {
    program.help();
    throw "unreachable";
  }

  const [_, sourceURL, line, column] = matches;

  const opts = program.opts();
  const beforeContext =
    opts.beforeContext !== undefined ? opts.beforeContext : opts.context;
  const afterContext =
    opts.afterContext !== undefined ? opts.afterContext : opts.context;

  return {
    debug: program.debug,
    sourceURL,
    position: { line: Number(line), column: Number(column) },
    beforeContext,
    afterContext,
    useSourceMap: program.sourceMap,
  };
}

function parseInteger(s: string): number {
  const n = Number(s);
  if ((n | 0) !== n || n < 0) {
    throw new CLIError(
      `${s} should be a positive integer. Use --help for help.`
    );
  }
  return n;
}
