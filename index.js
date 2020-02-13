#!/usr/bin/env node
const fetch = require("node-fetch")
const { minify } = require("uglify-es")
const { SourceMapConsumer } = require("source-map")
const { highlight } = require("cardinal")

class CLIError extends Error {}

main().catch(e => {
  if (e instanceof CLIError) {
    console.error(e.message)
    process.exit(1)
  } else {
    console.error(e)
  }
})

async function main() {
  const { url, line, column } = parseArg()
  const response = await fetch(url)
  const body = await response.text()
  const uglifyResult = minify(body, {
    output: { beautify: true },
    sourceMap: {},
  })
  if (uglifyResult.error) {
    throw new CLIError(`Failed to parse response: ${uglifyResult.error}`)
  }
  const beautifiedPosition = await SourceMapConsumer.with(
    uglifyResult.map,
    null,
    consumer => {
      return consumer.generatedPositionFor({
        line,
        column,
        source: consumer.sources[0],
      })
    },
  )
  printContext(uglifyResult.code, beautifiedPosition)
}

function printContext(code, { line, column, lastColumn }) {
  if (lastColumn === null) {
    lastColumn = column + 1
  }

  const CONTEXT = 5
  const lines = code.split("\n")
  const before = lines.slice(line - CONTEXT, line)
  const after = lines.slice(line, line + CONTEXT)

  console.log(highlight(before.join("\n")))
  console.log(" ".repeat(column) + "^".repeat(lastColumn - column))
  console.log(highlight(after.join("\n")))
}

function parseArg() {
  const arg = process.argv[2]

  if (!arg) printUsageAndExit()

  const matches = /^(.*):(\d+):(\d+)$/.exec(arg)
  if (!matches) printUsageAndExit()

  const [_, url, line, column] = matches
  return { url, line, column }
}

function printUsageAndExit() {
  throw new CLIError("Usage: beautify-context [url]:[line]:[column]")
}
