import { minify } from "terser";
import { SourceMapConsumer } from "source-map";

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
  if (uglifyResult.error) {
    throw new CLIError(`Failed to parse response: ${uglifyResult.error}`);
  }

  return SourceMapConsumer.with(uglifyResult.map, null, (consumer) => ({
    fileName: source.fileName,
    content: uglifyResult.code,
    position: consumer.generatedPositionFor({
      line: source.position.line,
      column: source.position.column,
      source: consumer.sources[0],
    }),
  }));
}
