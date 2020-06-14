const readline = require("readline")

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
  const before = lines.slice(Math.max(line - CONTEXT, 0), line)
  const after = lines.slice(line, line + CONTEXT)

  if (fileName) {
    console.log(`File: ${fileName}`)
  }

  console.log(highlight(before.join("\n")))
  const beforeWidth = getStringWidth(lines[line - 1].slice(0, column))
  const markerWidth = getStringWidth(lines[line - 1].slice(column, lastColumn))
  console.log(" ".repeat(beforeWidth) + "^".repeat(markerWidth))
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

function getStringWidth(ch) {
  // YOLO
  return readline.Interface.prototype._getDisplayPos.call(
    {
      columns: Infinity,
      tabSize: 8,
    },
    ch,
  ).cols
}
