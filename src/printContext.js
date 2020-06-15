const readline = require("readline")

const cardinal = require("cardinal")

const log = require("./log")

module.exports = function printContext(source) {
  log.status()

  console.log(formatContext(source, { shouldHighlight: process.stdout.isTTY }))
}

function formatContext(
  { content, fileName, position: { line, column, lastColumn } },
  { shouldHighlight = false } = {},
) {
  if (!lastColumn) {
    lastColumn = column + 1
  }

  const highlight = shouldHighlight
    ? (code) => {
        try {
          return cardinal.highlight(code)
        } catch (_) {
          return code
        }
      }
    : (code) => code

  const CONTEXT = 5
  const lines = content.split("\n")
  const before = lines.slice(Math.max(line - CONTEXT, 0), line)
  const after = lines.slice(line, line + CONTEXT)

  let output = ""

  if (fileName) {
    output += `File: ${fileName}\n`
  }

  output += `${highlight(before.join("\n"))}\n`

  const beforeWidth = getStringWidth(lines[line - 1].slice(0, column))
  const markerWidth = getStringWidth(lines[line - 1].slice(column, lastColumn))
  output += " ".repeat(beforeWidth) + "^".repeat(markerWidth)

  if (after.length) {
    output += `\n${highlight(after.join("\n"))}`
  }

  return output
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

module.exports.__tests__ = { formatContext }
