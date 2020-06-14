#!/usr/bin/env node

const fetch = require("node-fetch")

const CLIError = require("./CLIError")
const parseArguments = require("./parseArguments")
const applyBeautify = require("./applyBeautify")
const applySourceMap = require("./applySourceMap")
const printContext = require("./printContext")
const log = require("./log")

main().catch((e) => {
  if (e instanceof CLIError) {
    log.error(e.message)
    process.exit(1)
  } else {
    log.error(
      `An unexpected error occured: ${e instanceof Error ? e.stack : e}`,
    )
  }
})

async function main() {
  const { sourceURL, position } = parseArguments()
  log.debug.disabled = true
  log.status("Fetching source code...")
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
