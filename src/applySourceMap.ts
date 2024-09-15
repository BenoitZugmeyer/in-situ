import {
  TraceMap,
  originalPositionFor,
  sourceContentFor,
} from "@jridgewell/trace-mapping";

import readSourceMap from "./readSourceMap.ts";
import log from "./log.ts";
import type { ApplyResult, InputSource } from "./types.ts";

export default async function applySourceMap({
  location,
  readResult,
}: InputSource): Promise<ApplyResult> {
  const sourceMapContent = await readSourceMap(readResult);
  if (!sourceMapContent) return { type: "unresolved" };

  const map = new TraceMap(sourceMapContent);

  const mappedLocation = originalPositionFor(map, location);
  if (!mappedLocation.source) {
    log.error("Failed to resolve the location with source map");
    return { type: "unresolved" };
  }

  const fileName = mappedLocation.source;
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
    location: mappedLocation,
    fileName,
  };
}
