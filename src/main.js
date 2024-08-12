#!/usr/bin/env node

import CLIError from "./CLIError.js";
import parseArguments from "./parseArguments.ts";
import applyBeautify from "./applyBeautify.js";
import applySourceMap from "./applySourceMap.js";
import printContext from "./printContext.js";
import log from "./log.js";
import read from "./read.ts";

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

  let bundle;
  try {
    bundle = await read(sourceURL);
  } catch (e) {
    throw new CLIError(`Failed to fetch source code: ${e}`);
  }

  let source = {
    content: bundle.content,
    fileName: undefined,
    position,
  };

  let mappedSource;
  if (useSourceMap) {
    mappedSource = await applySourceMap(source, bundle);
  }

  if (mappedSource && mappedSource.content) {
    source = mappedSource;
  } else {
    source = await applyBeautify(source);
  }

  printContext(source, { beforeContext, afterContext });
}
