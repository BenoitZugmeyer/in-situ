#!/usr/bin/env node
const url = require("url")

const fetch = require("node-fetch")
const { minify } = require("terser")
const { SourceMapConsumer } = require("source-map")
const cardinal = require("cardinal")

class CLIError extends Error {}

main().catch((e) => {
  if (e instanceof CLIError) {
    console.error(e.message)
    process.exit(1)
  } else {
    console.error(e)
  }
})

async function main() {
  const { sourceURL, position } = parseArg()
  const response = await fetch(sourceURL)
  const source = {
    content: await response.text(),
    fileName: undefined,
    position,
  }

  const mappedSource = await applySourceMap(source, sourceURL, response.headers)
  Object.assign(source, mappedSource)

  const shouldBeautify = !mappedSource || !mappedSource.content
  if (shouldBeautify) {
    Object.assign(source, applyBeautify(source))
  }

  printContext(source)
}

function parseArg() {
  const arg = process.argv[2]

  if (!arg) printUsageAndExit()

  const matches = /^(.*):(\d+):(\d+)$/.exec(arg)
  if (!matches) printUsageAndExit()

  const [_, sourceURL, line, column] = matches
  return { sourceURL, position: { line: Number(line), column: Number(column) } }
}

function printUsageAndExit() {
  throw new CLIError("Usage: beautify-context [url]:[line]:[column]")
}

async function applySourceMap(source, sourceURL, headers) {
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

function applyBeautify(source) {
  const uglifyResult = minify(source.content, {
    mangle: false,
    compress: false,
    output: { beautify: true },
    sourceMap: {},
  })
  if (uglifyResult.error) {
    throw new CLIError(`Failed to parse response: ${uglifyResult.error}`)
  }

  const consumer = new SourceMapConsumer(uglifyResult.map)
  return {
    fileName: source.fileName,
    content: uglifyResult.code,
    position: consumer.generatedPositionFor({
      line: source.position.line,
      column: source.position.column,
      source: consumer.sources[0],
    }),
  }
}

function printContext({
  content,
  fileName,
  position: { line, column, lastColumn },
}) {
  if (!lastColumn) {
    lastColumn = column + 1
  }

  const CONTEXT = 5
  const lines = content.split("\n")
  const before = lines.slice(line - CONTEXT, line)
  const after = lines.slice(line, line + CONTEXT)

  if (fileName) {
    console.log(`File: ${fileName}`)
  }
  console.log(highlight(before.join("\n")))
  console.log(" ".repeat(column) + "^".repeat(lastColumn - column))
  if (after.length) {
    console.log(highlight(after.join("\n")))
  }
}

function highlight(code) {
  if (process.stdout.isTTY) {
    return cardinal.highlight(code)
  }
  return code
}
