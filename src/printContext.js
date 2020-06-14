const cardinal = require("cardinal")

const log = require("./log")

module.exports = function printContext({
  content,
  fileName,
  position: { line, column, lastColumn },
}) {
  log.status()
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
    try {
      return cardinal.highlight(code)
    } catch (_) {
      // If the code fails to parse, don't highlight it
    }
  }
  return code
}
