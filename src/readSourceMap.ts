import log from "./log";
import { File } from "./read";

export default async function readSourceMap(
  bundle: File
): Promise<string | undefined> {
  const sourceMapPath = getSourceMapPath(bundle);
  if (!sourceMapPath) {
    log.debug("No source map found");
    return;
  }

  const inlineSourceMap = getSourceMapFromInlineURI(sourceMapPath);
  if (inlineSourceMap) {
    return inlineSourceMap;
  }

  try {
    log.status("Fetching source maps...");
    return (await bundle.readRelative(sourceMapPath)).content;
  } catch (e) {
    log.error(`Failed to fetch source map: ${e}`);
  }
}

function getSourceMapPath({
  headers,
  content,
}: Pick<File, "headers" | "content">) {
  if (headers.has("sourcemap")) {
    log.debug("Found source map path in 'sourcemap' header");
    return headers.get("sourcemap");
  }

  if (headers.has("x-sourcemap")) {
    log.debug("Found source map path in 'x-sourcemap' header");
    return headers.get("x-sourcemap");
  }

  const matches = content.match(
    /\/[*/][@#]\s*sourceMappingURL=(\S+?)\s*(?:\*\/\s*)?$/
  );
  if (matches) {
    log.debug("Found source map path in code comment");
    return matches[1];
  }
}

function getSourceMapFromInlineURI(sourceMapPath: string) {
  const inlineURIMatches = sourceMapPath.match(
    /^data:application\/json;(?:charset=(.*?);)?base64,/
  );
  if (inlineURIMatches) {
    log.debug("Using inline source maps");
    const [wholeMatch, charset] = inlineURIMatches;
    const rawData = sourceMapPath.slice(wholeMatch.length);
    return Buffer.from(rawData, "base64").toString(
      (charset as BufferEncoding | undefined) || undefined
    );
  }
}
