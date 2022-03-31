const commander = require("commander")

const CLIError = require("./CLIError")
const pkg = require("../package.json")

module.exports = function parseArguments(argv = process.argv) {
  const program = new commander.Command()
  program.name(pkg.name)
  program.description(pkg.description)
  program.option(
    "-A, --after-context <num>",
    "print <num> lines of trailing context after the selected line",
    parseInteger,
  )
  program.option(
    "-B, --before-context <num>",
    "print <num> lines of leading context before the selected line",
    parseInteger,
  )
  program.option(
    "-C, --context <num>",
    "print <num> lines of leading and trailing context surrounding the selected line",
    parseInteger,
  )
  program.option("--no-source-map", "don't try to use a source map")
  program.option("-d, --debug", "output extra debugging")
  program.version(pkg.version)
  program.arguments("<URL:LINE:COLUMN>")
  program.parse(argv)

  const arg = program.args[0]
  if (!arg) program.help()

  const matches = /^(.*):(\d+):(\d+)$/.exec(arg)
  if (!matches) program.help()

  const [_, sourceURL, line, column] = matches

  const beforeContext =
    program.beforeContext !== undefined
      ? program.beforeContext
      : program.context
  const afterContext =
    program.afterContext !== undefined ? program.afterContext : program.context

  return {
    debug: program.debug,
    sourceURL,
    position: { line: Number(line), column: Number(column) },
    beforeContext,
    afterContext,
    useSourceMap: program.sourceMap,
  }
}

function parseInteger(s) {
  const n = Number(s)
  if ((n | 0) !== n || n < 0) {
    throw new CLIError(
      `${s} should be a positive integer. Use --help for help.`,
    )
  }
  return n
}
