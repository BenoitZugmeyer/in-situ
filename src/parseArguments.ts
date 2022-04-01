import commander, { Option } from "commander";

import CLIError from "./CLIError";
import pkg from "../package.json";
import { ContextCommandArguments } from "./commands/context";
import { ModulesCommandArguments } from "./commands/modules";

type CommandArguments =
  | ({ command: "context" } & ContextCommandArguments)
  | ({ command: "modules" } & ModulesCommandArguments);
type Arguments = CommandArguments & { debug: boolean };

export default function parseArguments(argv = process.argv): Arguments {
  let result: CommandArguments | undefined;
  const program = new commander.Command();
  program.name(pkg.name);
  program.description(pkg.description);
  program.version(pkg.version);
  program.option("-d, --debug", "output extra debugging");

  const contextCommand = program.command(
    "context",
    // @ts-ignore looks like incorrect commander typings
    { isDefault: true }
  );
  contextCommand.option(
    "-A, --after-context <num>",
    "print <num> lines of trailing context after the selected line",
    parseInteger
  );
  contextCommand.option(
    "-B, --before-context <num>",
    "print <num> lines of leading context before the selected line",
    parseInteger
  );
  contextCommand.option(
    "-C, --context <num>",
    "print <num> lines of leading and trailing context surrounding the selected line",
    parseInteger
  );
  contextCommand.option("--no-source-map", "don't try to use a source map");
  contextCommand.arguments("<URL:LINE:COLUMN>");
  contextCommand.action((arg, options) => {
    const matches = /^(.*):(\d+):(\d+)$/.exec(arg);
    if (!matches) {
      return;
    }
    const [_, sourceURL, line, column] = matches;

    const beforeContext =
      options.beforeContext !== undefined
        ? options.beforeContext
        : options.context;
    const afterContext =
      options.afterContext !== undefined
        ? options.afterContext
        : options.context;

    result = {
      command: "context",
      sourceURL,
      position: { line: parseInteger(line), column: parseInteger(column) },
      beforeContext,
      afterContext,
      useSourceMap: Boolean(options.sourceMap),
    };
  });

  const modulesCommand = program.command("modules");
  modulesCommand.arguments("<URL>");
  modulesCommand.option("--no-consolidate-null");
  modulesCommand.addOption(
    new Option("-s, --sort <criterion>")
      .choices(["path", "size"])
      .default("size")
  );
  modulesCommand.addOption(
    new Option(
      "-l, --limit <criterion>",
      "limit the number of entries to display"
    )
  );
  modulesCommand.option("--map", "display as a treemap");
  modulesCommand.action((sourceURL, options) => {
    result = {
      command: "modules",
      sourceURL,
      consolidateNull: !!options.consolidateNull,
      sort: options.sort,
      limit: parseLimit(options.limit),
      map: options.map,
    };
  });
  program.parse(argv);

  if (!result) {
    program.help();
    throw "unreachable"; // program.help() is calling process.exit()
  }

  return {
    ...result,
    debug: program.opts().debug,
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

function parseLimit(limit: string | undefined): Limit | undefined {
  if (limit === undefined) {
    return;
  }
  const matches = /^([<>-])?(\d+)([km]?b)?$/i.exec(limit);
  if (!matches) {
    throw new CLIError("Invalid limit argument");
  }
  const operator = matches[1];
  let number = Number(matches[2]);
  const unit = matches[3]?.toLowerCase();
  if (unit) {
    switch (unit) {
      case "kb":
        number *= 1000;
        break;
      case "mb":
        number *= 1000 ** 2;
        break;
    }

    let min: number;
    let max: number;
    switch (operator) {
      case "-":
        throw new CLIError("Invalid limit argument");

      case "<":
        min = -Infinity;
        max = number;
        break;

      default:
      case ">":
        min = number;
        max = Infinity;
        break;
    }
    return {
      type: "size",
      min,
      max,
    };
  } else {
    let count: number;
    switch (operator) {
      case "<":
      case ">":
        throw new CLIError("Invalid limit argument");

      case "-":
        count = -number;
        break;
      default:
        count = number;
    }
    return {
      type: "count",
      count,
    };
  }
}
