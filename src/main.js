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
  const {
    debug,
    sourceURL,
    position,
    beforeContext,
    afterContext,
    sourceMap,
  } = parseArguments()
  log.debug.disabled = !debug
  log.status("Fetching source code...")
  let response
  try {
    response = await fetch(sourceURL)
  } catch (e) {
    throw CLIError(`Failed to fetch source code: ${e}`)
  }
  const source = {
    content: await response.text(),
    fileName: undefined,
    position,
  }

  const mappedSource =
    sourceMap && (await applySourceMap(source, sourceURL, response.headers))
  Object.assign(source, mappedSource)

  const shouldBeautify = !mappedSource || !mappedSource.content
  if (shouldBeautify) {
    Object.assign(source, await applyBeautify(source))
  }

  printContext(source, { beforeContext, afterContext })
}
