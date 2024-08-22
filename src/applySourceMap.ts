import {
  TraceMap,
  originalPositionFor,
  sourceContentFor,
} from "@jridgewell/trace-mapping";

import readSourceMap from "./readSourceMap.ts";
import log from "./log.js";
import type { ApplyResult, InputSource } from "./types.ts";

export default async function applySourceMap({
  position,
  readResult,
}: InputSource): Promise<ApplyResult> {
  const sourceMapContent = await readSourceMap(readResult);
  if (!sourceMapContent) return { type: "unresolved" };

  const map = new TraceMap(sourceMapContent);

  const mappedPosition = originalPositionFor(map, position);
  if (!mappedPosition.source) {
    log.error("Failed to resolve the position with source map");
    return { type: "unresolved" };
  }

  const fileName = mappedPosition.source;
  const content = sourceContentFor(map, fileName);
  if (!content) {
    log.error("Source map doesn't include the source content");
    return {
      type: "file-name-only",
      fileName,
    };
  }

  return {
    type: "resolved",
    content,
    position: mappedPosition,
    fileName,
  };
}
