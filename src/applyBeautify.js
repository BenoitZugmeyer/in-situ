const { minify } = require("terser")
const { SourceMapConsumer } = require("source-map")

const CLIError = require("./CLIError")
const log = require("./log")

module.exports = async function applyBeautify(source) {
  log.status("Beautifying source code...")
  let uglifyResult
  try {
    uglifyResult = await minify(source.content, {
      mangle: false,
      compress: false,
      output: { beautify: true },
      sourceMap: true,
    })
  } catch (error) {
    throw new CLIError(`Failed to parse response: ${error}`)
  }
  if (uglifyResult.error) {
    throw new CLIError(`Failed to parse response: ${uglifyResult.error}`)
  }

  return SourceMapConsumer.with(uglifyResult.map, null, (consumer) => ({
    fileName: source.fileName,
    content: uglifyResult.code,
    position: consumer.generatedPositionFor({
      line: source.position.line,
      column: source.position.column,
      source: consumer.sources[0],
    }),
  }))
}
