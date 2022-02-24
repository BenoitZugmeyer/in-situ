const { SourceMapConsumer } = require("source-map")

const log = require("./log")

module.exports = async function applySourceMap({ position }, bundle) {
  const sourceMapContent = await readSourceMap(bundle)
  if (!sourceMapContent) return

  const consumer = new SourceMapConsumer(sourceMapContent)

  const mappedPosition = consumer.originalPositionFor({
    line: position.line,
    column: position.column,
  })
  if (!mappedPosition.source) {
    log.error("Failed to resolve the position with source map")
    return
  }

  const fileName = mappedPosition.source
  const content = consumer.sourceContentFor(fileName, true)
  if (!content) {
    log.error("Source map doesn't include the source content")
    return { fileName }
  }

  return {
    content,
    position: mappedPosition,
    fileName,
  }
}

async function readSourceMap(bundle) {
  const sourceMapPath = getSourceMapPath(bundle)
  if (!sourceMapPath) {
    log.debug("No source map found")
    return
  }

  const inlineSourceMap = getSourceMapFromInlineURI(sourceMapPath)
  if (inlineSourceMap) {
    return inlineSourceMap
  }

  try {
    log.status("Fetching source maps...")
    return (await bundle.readRelative(sourceMapPath)).content
  } catch (e) {
    log.error(`Failed to fetch source map: ${e}`)
  }
}

function getSourceMapPath({ headers, content }) {
  if (headers.has("sourcemap")) {
    log.debug("Found source map path in 'sourcemap' header")
    return headers.get("sourcemap")
  }

  if (headers.has("x-sourcemap")) {
    log.debug("Found source map path in 'x-sourcemap' header")
    return headers.get("x-sourcemap")
  }

  const matches = content.match(
    /\/[*/][@#]\s*sourceMappingURL=(\S+?)\s*(?:\*\/\s*)?$/,
  )
  if (matches) {
    log.debug("Found source map path in code comment")
    return matches[1]
  }
}

function getSourceMapFromInlineURI(sourceMapPath) {
  const inlineURIMatches = sourceMapPath.match(
    /^data:application\/json;(?:charset=(.*?);)?base64,/,
  )
  if (inlineURIMatches) {
    log.debug("Using inline source maps")
    const [wholeMatch, charset] = inlineURIMatches
    const rawData = sourceMapPath.slice(wholeMatch.length)
    return Buffer.from(rawData, "base64").toString(charset || undefined)
  }
}
