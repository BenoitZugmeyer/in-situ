const CLIError = require("./CLIError")
const { minify } = require("terser")
const { SourceMapConsumer } = require("source-map")

module.exports = function applyBeautify(source) {
  const uglifyResult = minify(source.content, {
    mangle: false,
    compress: false,
    output: { beautify: true },
    sourceMap: {},
  })
  if (uglifyResult.error) {
    throw new CLIError(`Failed to parse response: ${uglifyResult.error}`)
  }

  const consumer = new SourceMapConsumer(uglifyResult.map)
  return {
    fileName: source.fileName,
    content: uglifyResult.code,
    position: consumer.generatedPositionFor({
      line: source.position.line,
      column: source.position.column,
      source: consumer.sources[0],
    }),
  }
}
