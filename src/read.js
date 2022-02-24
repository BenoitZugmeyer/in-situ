const fetch = require("node-fetch")
const url = require("url")
const path = require("path")
const { readFile } = require("fs/promises")

const log = require("./log")

module.exports = function read(location) {
  return isRemoteUrl(location) ? readRemote(location) : readLocal(location)
}

function isRemoteUrl(location) {
  return location.startsWith("http://") || location.startsWith("https://")
}

async function readRemote(location) {
  log.debug(`Read remote file ${location}`)
  const response = await fetch(location)
  if (response.status !== 200) {
    throw new Error(`Failed to fetch: ${response.statusText}`)
  }

  const content = await response.text()

  return {
    content,
    headers: response.headers,
    readRelative(relativePath) {
      return readRemote(url.resolve(location, relativePath))
    },
  }
}

async function readLocal(location) {
  log.debug(`Read local file ${location}`)
  const content = await readFile(location, { encoding: "utf-8" })
  return {
    content,
    headers: new Map(),
    readRelative(relativePath) {
      return readLocal(path.join(path.dirname(location), relativePath))
    },
  }
}
