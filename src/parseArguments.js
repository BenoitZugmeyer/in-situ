const commander = require("commander")

const pkg = require("../package.json")

module.exports = function parseArguments() {
  const program = new commander.Command()
  program.version(pkg.version)
  program.name(pkg.name)
  program.description(pkg.description)
  program.option("-d, --debug", "output extra debugging")
  program.arguments("<URL:LINE:COLUMN>")
  program.parse(process.argv)

  const arg = program.args[0]
  if (!arg) program.help()

  const matches = /^(.*):(\d+):(\d+)$/.exec(arg)
  if (!matches) program.help()

  const [_, sourceURL, line, column] = matches
  return {
    debug: program.debug,
    sourceURL,
    position: { line: Number(line), column: Number(column) },
  }
}
