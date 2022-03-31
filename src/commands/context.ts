import applyBeautify from "../applyBeautify";
import applySourceMap from "../applySourceMap";
import printContext from "../printContext";
import log from "../log";
import read from "../read";
import CLIError from "../CLIError.js";
import { Position } from "../types";

export interface ContextCommandArguments {
  sourceURL: string;
  position: Position;
  useSourceMap: boolean;
  beforeContext: number;
  afterContext: number;
}

export default async function contextCommand({
  sourceURL,
  position,
  useSourceMap,
  beforeContext,
  afterContext,
}: ContextCommandArguments) {
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
