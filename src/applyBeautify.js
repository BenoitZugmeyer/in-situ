import { minify } from "terser";
import { TraceMap, generatedPositionFor } from "@jridgewell/trace-mapping";

import CLIError from "./CLIError.js";
import log from "./log.js";

export default async function applyBeautify(source) {
  log.status("Beautifying source code...");
  let uglifyResult;
  try {
    uglifyResult = await minify(source.content, {
      mangle: false,
      compress: false,
      output: { beautify: true },
      sourceMap: true,
    });
  } catch (error) {
    throw new CLIError(`Failed to parse response: ${error}`);
  }

  const map = new TraceMap(uglifyResult.map);
  return {
    fileName: source.fileName,
    content: uglifyResult.code,
    position: generatedPositionFor(map, {
      line: source.position.line,
      column: source.position.column,
      source: map.sources[0],
    }),
  };
}
