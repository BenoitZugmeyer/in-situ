#!/usr/bin/env node

const fetch = require("node-fetch")

const CLIError = require("./CLIError")
const parseArguments = require("./parseArguments")
const applyBeautify = require("./applyBeautify")
const applySourceMap = require("./applySourceMap")
const printContext = require("./printContext")

main().catch((e) => {
  if (e instanceof CLIError) {
    console.error(e.message)
    process.exit(1)
  } else {
    console.error(e)
  }
})

async function main() {
  const { sourceURL, position } = parseArguments()
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
