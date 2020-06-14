const url = require("url")

const fetch = require("node-fetch")
const { SourceMapConsumer } = require("source-map")

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
  if (!position.source) return

  const fileName = position.source
  const content = consumer.sourceContentFor(fileName, true)
  if (!content) return { fileName }

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
    const [wholeMatch, charset] = inlineURIMatches
    const rawData = sourceMapPath.slice(wholeMatch.length)
    return Buffer.from(rawData, "base64").toString(charset || undefined)
  }

  const sourceMapAbsoluteURL = url.resolve(sourceURL, sourceMapPath)
  const response = await fetch(sourceMapAbsoluteURL)
  if (response.status !== 200) return

  return await response.text()
}

function getSourceMapPath(sourceContent, headers) {
  if (headers.has("sourcemap")) {
    return headers.get("sourcemap")
  }

  if (headers.has("x-sourcemap")) {
    return headers.get("x-sourcemap")
  }

  const matches = sourceContent.match(
    /\/[*/][@#]\s*sourceMappingURL=(\S+?)\s*(?:\*\/\s*)?$/,
  )
  if (matches) {
    return matches[1]
  }
}
