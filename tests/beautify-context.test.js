const { spawn } = require("child_process")
const http = require("http")

function runBeautifyContext(...args) {
  return new Promise((resolve) => {
    const path = require.resolve("..")
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
  expect(await runBeautifyContext()).toEqual({
    code: 1,
    stderr: "Usage: beautify-context [url]:[line]:[column]\n",
    stdout: "",
  })
})

test("beautifies context", async () => {
  const url = await withServer({
    "/": "if(i)j.k",
  })
  expect(await runBeautifyContext(`${url}:1:8`)).toEqual({
    code: 0,
    stderr: "",
    stdout: `\
if (i) j.k;
         ^
`,
  })
})
