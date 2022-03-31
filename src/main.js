#!/usr/bin/env node

const CLIError = require("./CLIError")
import parseArguments from "./parseArguments"
const applyBeautify = require("./applyBeautify")
const applySourceMap = require("./applySourceMap")
const printContext = require("./printContext")
const log = require("./log")
const read = require("./read")

main().catch((e) => {
  if (e instanceof CLIError) {
    log.error(e.message)
    process.exit(1)
  } else {
    log.error(
      `An unexpected error occurred: ${e instanceof Error ? e.stack : e}`,
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
    useSourceMap,
  } = parseArguments()
  log.debug.disabled = !debug
  log.status("Fetching source code...")

  let bundle
  try {
    bundle = await read(sourceURL)
  } catch (e) {
    throw new CLIError(`Failed to fetch source code: ${e}`)
  }

  let source = {
    content: bundle.content,
    fileName: undefined,
    position,
  }

  let mappedSource
  if (useSourceMap) {
    mappedSource = await applySourceMap(source, bundle)
  }

  if (mappedSource && mappedSource.content) {
    source = mappedSource
  } else {
    source = await applyBeautify(source)
  }

  printContext(source, { beforeContext, afterContext })
}
