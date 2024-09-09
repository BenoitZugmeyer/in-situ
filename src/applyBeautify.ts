import { minify } from "terser";
import { TraceMap, generatedPositionFor } from "@jridgewell/trace-mapping";

import CLIError from "./CLIError.js";
import log from "./log.js";
import type { ApplyResult, InputSource } from "./types.js";

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
  const position = generatedPositionFor(map, {
    line: source.position.line,
    column: source.position.column,
    source: map.sources[0]!,
  });
  if (position.line === null || position.column === null) {
    throw new CLIError("Failed to map position using beautify");
  }
  return {
    type: "resolved",
    fileName: undefined,
    content: uglifyResult.code!,
    position,
  };
}
