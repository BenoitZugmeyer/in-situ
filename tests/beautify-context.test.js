const { spawn } = require("child_process")
const http = require("http")

function runBeautifyContext(...args) {
  return new Promise((resolve) => {
    const path = require.resolve("../src/main")
    const process = spawn("node", [path, ...args])

    const stderr = []
    const stdout = []
    process.stdout.on("data", (data) => stdout.push(data))
    process.stderr.on("data", (data) => stderr.push(data))

    process.on("close", (code) => {
      resolve({
        code,
        stderr: Buffer.concat(stderr).toString("utf-8"),
        stdout: Buffer.concat(stdout).toString("utf-8"),
      })
    })
  })
}

const servers = []
function withServer(responses) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.url in responses) {
        const r = responses[request.url]
        if (typeof r === "string") {
          response.writeHead(200, "OK")
          response.end(r)
        } else {
          response.writeHead(200, "OK", r.headers)
          response.end(r.body)
        }
      } else {
        response.writeHead(404, "Not found")
        response.end("Not found")
      }
    })
    server.on("error", reject)
    server.listen(0, "127.0.0.1", () => {
      resolve(`http://${server.address().address}:${server.address().port}`)
    })
    servers.push(server)
  })
}
afterEach(() => {
  servers.forEach((server) => server.close())
  servers.length = 0
})

test("fails if no argument is given", async () => {
  expect(await runBeautifyContext()).toMatchSnapshot()
})

test("beautifies context", async () => {
  const url = await withServer({
    "/": "if(i)j.k",
  })
  expect(await runBeautifyContext(`${url}:1:8`)).toMatchSnapshot()
})

describe("source map", () => {
  const generatedCode = "var o=document.title;console.log(o);\n"
  const sourceMap = JSON.stringify({
    version: 3,
    file: "bundle.min.js",
    sources: ["index.js"],
    sourcesContent: ["const title = document.title\nconsole.log(title)\n"],
    names: ["title", "document", "console", "log"],
    mappings: "AAAA,IAAMA,EAAQC,SAASD,MACvBE,QAAQC,IAAIH",
  })

  async function testSourceMapRetrieval(responses) {
    const url = await withServer(responses)
    expect(
      await runBeautifyContext(`${url}/bundle.min.js:1:11`),
    ).toMatchSnapshot()
  }

  test("use the source map from a sourcemap comment", async () => {
    await testSourceMapRetrieval({
      "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
      "/bundle.min.js.map": sourceMap,
    })
  })

  test("use the source map from a X-SourceMap header", async () => {
    await testSourceMapRetrieval({
      "/bundle.min.js": {
        body: generatedCode,
        headers: { "X-SourceMap": "bundle.min.js.map" },
      },
      "/bundle.min.js.map": sourceMap,
    })
  })

  test("use the source map from a SourceMap header", async () => {
    await testSourceMapRetrieval({
      "/bundle.min.js": {
        body: generatedCode,
        headers: { SourceMap: "bundle.min.js.map" },
      },
      "/bundle.min.js.map": sourceMap,
    })
  })

  test("use the source map from a data-uri", async () => {
    const base64EncodedSourceMap = Buffer.from(sourceMap).toString("base64")
    await testSourceMapRetrieval({
      "/bundle.min.js": `${generatedCode}\n//@ sourceMappingURL=data:application/json;charset=utf-8;base64,${base64EncodedSourceMap}`,
    })
  })

  test("fallback to beautify if the source map is not found", async () => {
    await testSourceMapRetrieval({
      "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
    })
  })
})
