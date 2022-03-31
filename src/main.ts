#!/usr/bin/env node

import CLIError from "./CLIError";
import parseArguments from "./parseArguments";
import contextCommand from "./commands/context";
import modulesCommand from "./commands/modules";
import log from "./log";

main().catch((e) => {
  if (e instanceof CLIError) {
    log.error(e.message);
    process.exit(1);
  } else {
    log.error(
      `An unexpected error occurred: ${e instanceof Error ? e.stack : e}`
    );
  }
});

async function main() {
  const args = parseArguments();
  log.debug.disabled = !args.debug;
  switch (args.command) {
    case "context":
      await contextCommand(args);
      break;
    case "modules":
      await modulesCommand(args);
      break;
  }
}
