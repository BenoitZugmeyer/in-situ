const { spawn } = require("child_process")
const { readFileSync } = require("fs")
const http = require("http")

// generated with
// npx terser index.js --mangle -o bundle.min.js -e --toplevel --source-map includeSources
const generatedCode =
  "(function(){const o=document.title;console.log(`\t`,o);window.杨=o})();"

const sourceMap = JSON.stringify({
  version: 3,
  file: "bundle.min.js",
  sources: ["index.js"],
  names: ["title", "document", "console", "log", "window", "杨"],
  mappings: "YAAA,MAAMA,EAAQC,SAASD,MACvBE,QAAQC,IAAI,KAAKH,GACjBI,OAAOC,EAAIL",
  sourcesContent: [
    "const title = document.title\nconsole.log(`\t`, title)\nwindow.杨 = title\n",
  ],
})

test("fails if no argument is given", async () => {
  expect(await runBin()).toMatchSnapshot()
})

test("beautifies context", async () => {
  const url = await withServer({
    "/": generatedCode,
  })
  expect(await runBin(`${url}:1:53`)).toMatchSnapshot()
})

test("context options", async () => {
  const url = await withServer({
    "/": generatedCode,
  })
  expect(await runBin(`${url}:1:53`, "-C", "1")).toMatchSnapshot()
  expect(await runBin(`${url}:1:53`, "-C", "0")).toMatchSnapshot()
  expect(await runBin(`${url}:1:53`, "-A", "0")).toMatchSnapshot()
  expect(await runBin(`${url}:1:53`, "-B", "0")).toMatchSnapshot()
})

describe("source map retrieval", () => {
  async function testSourceMapRetrieval(responses) {
    const url = await withServer(responses)
    expect(await runBin(`${url}/bundle.min.js:1:66`)).toMatchSnapshot()
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

  test("no source map option", async () => {
    const url = await withServer({
      "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
      "/bundle.min.js.map": sourceMap,
    })
    expect(
      await runBin(`${url}/bundle.min.js:1:66`, "--no-source-map"),
    ).toMatchSnapshot()
  })
})

describe("README examples", () => {
  const readmeContent = readFileSync(require.resolve("../README.md"), {
    encoding: "utf-8",
  })

  const usage = readmeContent.match(/## Usage\n\n```\n(.*?)```/s)[1]
  const [_, exampleCommand, exampleOutput] = readmeContent.match(
    /## Example\n\n```\nin-situ (.*?)\n```\n```js\n(.*?)```/s,
  )

  test("usage format", async () => {
    expect(await runBin("--help")).toEqual({
      code: 0,
      stdout: usage,
      stderr: "",
    })
  })

  test("example", async () => {
    const result = await runBin(...exampleCommand.split(" "))
    expect(result.stdout.replace(/\t/g, "        ")).toEqual(exampleOutput)
  })
})

function runBin(...args) {
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
