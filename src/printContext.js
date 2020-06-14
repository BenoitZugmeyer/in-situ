const cardinal = require("cardinal")

module.exports = function printContext({
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
