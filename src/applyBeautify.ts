import { minify } from "terser";
import { TraceMap, generatedPositionFor } from "@jridgewell/trace-mapping";

import CLIError from "./CLIError.ts";
import log from "./log.ts";
import type { ApplyResult, InputSource } from "./types.ts";

declare module "terser" {
  interface MinifyOutput {
    error?: Error;
  }
}

export default async function applyBeautify(
  source: InputSource,
): Promise<ApplyResult> {
  log.status("Beautifying source code...");
  let uglifyResult;
  try {
    uglifyResult = await minify(source.readResult.content, {
      mangle: false,
      compress: false,
      output: { beautify: true },
      sourceMap: true,
    });
  } catch (error) {
    throw new CLIError(`Failed to parse response: ${error}`);
  }

  const map = new TraceMap(uglifyResult.map as string);
  const location = generatedPositionFor(map, {
    line: source.location.line,
    column: source.location.column,
    source: map.sources[0]!,
  });
  if (location.line === null || location.column === null) {
    throw new CLIError("Failed to map location using beautify");
  }
  return {
    type: "resolved",
    fileName: undefined,
    content: uglifyResult.code!,
    location,
  };
}
