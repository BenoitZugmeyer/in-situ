#!/usr/bin/env node

import CLIError from "./CLIError.js";
import parseArguments from "./parseArguments.ts";
import applyBeautify from "./applyBeautify.js";
import applySourceMap from "./applySourceMap.js";
import printContext from "./printContext.js";
import log from "./log.js";
import read from "./read.ts";
import { ApplyResult } from "./types.ts";

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
  const {
    debug,
    sourceURL,
    position,
    beforeContext,
    afterContext,
    useSourceMap,
  } = parseArguments();
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
    applyResult = await applySourceMap({ readResult, position });
  }
  if (applyResult.type !== "resolved") {
    // TODO: use filename from sourcemaps? is that an actual use case?
    applyResult = await applyBeautify({ readResult, position });
  }
  if (applyResult.type !== "resolved") {
    throw new CLIError("Failed to apply source map or beautify");
  }

  printContext(applyResult, { beforeContext, afterContext });
}
