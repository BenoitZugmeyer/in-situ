const CLIError = require("./CLIError")

module.exports = function parseArguments() {
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
