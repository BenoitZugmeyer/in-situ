import { SourceMapConsumer } from "source-map";

import readSourceMap from "./readSourceMap.ts";
import log from "./log.js";

export default async function applySourceMap({ position }, bundle) {
  const sourceMapContent = await readSourceMap(bundle);
  if (!sourceMapContent) return;

  return await SourceMapConsumer.with(
    sourceMapContent,
    null,
    async (consumer) => {
      const mappedPosition = consumer.originalPositionFor({
        line: position.line,
        column: position.column,
      });
      if (!mappedPosition.source) {
        log.error("Failed to resolve the position with source map");
        return;
      }

      const fileName = mappedPosition.source;
      const content = consumer.sourceContentFor(
        fileName,
        true, // return null on missing
      );
      if (!content) {
        log.error("Source map doesn't include the source content");
        return { fileName };
      }

      return {
        content,
        position: mappedPosition,
        fileName,
      };
    },
  );
}
