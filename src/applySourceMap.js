import {
  TraceMap,
  originalPositionFor,
  sourceContentFor,
} from "@jridgewell/trace-mapping";

import readSourceMap from "./readSourceMap.ts";
import log from "./log.js";

export default async function applySourceMap({ position }, bundle) {
  const sourceMapContent = await readSourceMap(bundle);
  if (!sourceMapContent) return;

  const map = new TraceMap(JSON.parse(sourceMapContent));

  const mappedPosition = originalPositionFor(map, position);
  if (!mappedPosition.source) {
    log.error("Failed to resolve the position with source map");
    return;
  }

  const fileName = mappedPosition.source;
  const content = sourceContentFor(map, fileName);
  if (!content) {
    log.error("Source map doesn't include the source content");
    return { fileName };
  }

  return {
    content,
    position: mappedPosition,
    fileName,
  };
}
