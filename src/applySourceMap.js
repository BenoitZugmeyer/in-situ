const url = require("url")

const fetch = require("node-fetch")
const { SourceMapConsumer } = require("source-map")

const log = require("./log")

module.exports = async function applySourceMap(source, sourceURL, headers) {
  const sourceMapPath = getSourceMapPath(source.content, headers)
  if (!sourceMapPath) return

  const sourceMap = await getSourceMap(sourceMapPath, sourceURL)
  if (!sourceMap) return

  const consumer = new SourceMapConsumer(sourceMap)

  const position = consumer.originalPositionFor({
    line: source.position.line,
    column: source.position.column,
  })
  if (!position.source) {
    log.error("Failed to resolve the position with source map")
    return
  }

  const fileName = position.source
  const content = consumer.sourceContentFor(fileName, true)
  if (!content) {
    log.error("Source map doesn't include the source content")
    return { fileName }
  }

  return {
    content,
    position,
    fileName,
  }
}

async function getSourceMap(sourceMapPath, sourceURL) {
  const inlineURIMatches = sourceMapPath.match(
    /^data:application\/json;(?:charset=(.*?);)?base64,/,
  )
  if (inlineURIMatches) {
    log.debug("Using inline source maps")
    const [wholeMatch, charset] = inlineURIMatches
    const rawData = sourceMapPath.slice(wholeMatch.length)
    return Buffer.from(rawData, "base64").toString(charset || undefined)
  }

  log.status("Fetching source maps...")
  const sourceMapAbsoluteURL = url.resolve(sourceURL, sourceMapPath)
  log.debug(`Source maps URL: ${sourceMapAbsoluteURL}`)
  let response
  try {
    response = await fetch(sourceMapAbsoluteURL)
  } catch (e) {
    log.error(`Failed to fetch source maps: ${e}`)
    return
  }
  if (response.status !== 200) {
    log.error(`Failed to fetch source maps: ${response.statusText}`)
    return
  }

  return await response.text()
}

function getSourceMapPath(sourceContent, headers) {
  if (headers.has("sourcemap")) {
    log.debug("Found source map path in 'sourcemap' header")
    return headers.get("sourcemap")
  }

  if (headers.has("x-sourcemap")) {
    log.debug("Found source map path in 'x-sourcemap' header")
    return headers.get("x-sourcemap")
  }

  const matches = sourceContent.match(
    /\/[*/][@#]\s*sourceMappingURL=(\S+?)\s*(?:\*\/\s*)?$/,
  )
  if (matches) {
    log.debug("Found source map path in code comment")
    return matches[1]
  }
}
