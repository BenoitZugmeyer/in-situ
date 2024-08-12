import { test, afterEach, describe, before } from "node:test";
import { promisify } from "util";
import childProcess from "child_process";
import { readFileSync } from "fs";
import http from "http";

const spawn = childProcess.spawn;
const execFile = promisify(childProcess.execFile);

// generated with
// npx terser index.js --mangle -o bundle.min.js -e --toplevel --source-map includeSources
const generatedCode =
  "(function(){const o=document.title;console.log(`\t`,o);window.杨=o})();";

const sourceMap = JSON.stringify({
  version: 3,
  file: "bundle.min.js",
  sources: ["index.js"],
  names: ["title", "document", "console", "log", "window", "杨"],
  mappings: "YAAA,MAAMA,EAAQC,SAASD,MACvBE,QAAQC,IAAI,KAAKH,GACjBI,OAAOC,EAAIL",
  sourcesContent: [
    "const title = document.title\nconsole.log(`\t`, title)\nwindow.杨 = title\n",
  ],
});

before(async () => {
  await execFile("./tools/build.js");
});

const cleanupCallbacks = [];
afterEach(() => {
  cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
  cleanupCallbacks.length = 0;
});

test("fails if no argument is given", async ({ assert }) => {
  assert.snapshot(await runBin());
});

test("context options", async ({ assert }) => {
  const url = await withServer({
    "/": generatedCode,
  });
  assert.snapshot(await runBin(`${url}:1:53`, "-C", "1"));
  assert.snapshot(await runBin(`${url}:1:53`, "-C", "0"));
  assert.snapshot(await runBin(`${url}:1:53`, "-A", "0"));
  assert.snapshot(await runBin(`${url}:1:53`, "-B", "0"));
});

describe("code beautifier", () => {
  test("beautifies code", async ({ assert }) => {
    const url = await withServer({
      "/": generatedCode,
    });
    assert.snapshot(await runBin(`${url}:1:53`));
  });

  test("fail if the code has a syntax error", async ({ assert }) => {
    const url = await withServer({
      "/": "<html>",
    });
    assert.snapshot(await runBin(`${url}:1:53`));
  });
});

describe("source map retrieval", () => {
  async function testSourceMapRetrieval(responses) {
    const url = await withServer(responses);
    return await runBin(`${url}/bundle.min.js:1:66`);
  }

  test("use the source map from a sourcemap comment", async ({ assert }) => {
    assert.snapshot(
      await testSourceMapRetrieval({
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        "/bundle.min.js.map": sourceMap,
      }),
    );
  });

  test("use the source map from a X-SourceMap header", async ({ assert }) => {
    assert.snapshot(
      await testSourceMapRetrieval({
        "/bundle.min.js": {
          body: generatedCode,
          headers: { "X-SourceMap": "bundle.min.js.map" },
        },
        "/bundle.min.js.map": sourceMap,
      }),
    );
  });

  test("use the source map from a SourceMap header", async ({ assert }) => {
    assert.snapshot(
      await testSourceMapRetrieval({
        "/bundle.min.js": {
          body: generatedCode,
          headers: { SourceMap: "bundle.min.js.map" },
        },
        "/bundle.min.js.map": sourceMap,
      }),
    );
  });

  test("use the source map from a data-uri", async ({ assert }) => {
    const base64EncodedSourceMap = Buffer.from(sourceMap).toString("base64");
    assert.snapshot(
      await testSourceMapRetrieval({
        "/bundle.min.js": `${generatedCode}\n//@ sourceMappingURL=data:application/json;charset=utf-8;base64,${base64EncodedSourceMap}`,
      }),
    );
  });

  test("fallback to beautify if the source map is not found", async ({
    assert,
  }) => {
    assert.snapshot(
      await testSourceMapRetrieval({
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
      }),
    );
  });

  test("no source map option", async ({ assert }) => {
    const url = await withServer({
      "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
      "/bundle.min.js.map": sourceMap,
    });
    assert.snapshot(
      await runBin(`${url}/bundle.min.js:1:66`, "--no-source-map"),
    );
  });
});

describe("README examples", () => {
  const readmeContent = readFileSync("./README.md", {
    encoding: "utf-8",
  });

  const usage = readmeContent.match(/## Usage\n\n```\n(.*?)```/s)[1];
  const [_, exampleCommand, exampleOutput] = readmeContent.match(
    /## Example\n\n```\nin-situ (.*?)\n```\n\n```js\n(.*?)```/s,
  );

  test("usage format", async ({ assert }) => {
    assert.deepStrictEqual(await runBin("--help"), {
      code: 0,
      stdout: usage,
      stderr: "",
    });
  });

  test("example", async ({ assert }) => {
    const result = await runBin(...exampleCommand.split(" "));
    assert.deepStrictEqual(
      result.stdout.replace(/\t/g, "        "),
      exampleOutput,
    );
  });
});

async function runBin(...args) {
  return new Promise((resolve) => {
    const process = spawn("node", ["./main.js", ...args]);

    const stderr = [];
    const stdout = [];
    process.stdout.on("data", (data) => stdout.push(data));
    process.stderr.on("data", (data) => stderr.push(data));

    process.on("close", (code) => {
      resolve({
        code,
        stderr: Buffer.concat(stderr)
          .toString("utf-8")
          .replace(/.*(Deprecation|Experimental)Warning:.*\n/g, "")
          .replace(/.*\(Use `node --trace-(deprecation|warnings).*\n/g, ""),
        stdout: Buffer.concat(stdout).toString("utf-8"),
      });
    });
  });
}

function withServer(responses) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.url in responses) {
        const r = responses[request.url];
        if (typeof r === "string") {
          response.writeHead(200, "OK");
          response.end(r);
        } else {
          response.writeHead(200, "OK", r.headers);
          response.end(r.body);
        }
      } else {
        response.writeHead(404, "Not found");
        response.end("Not found");
      }
    });
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      resolve(`http://${server.address().address}:${server.address().port}`);
    });
    cleanupCallbacks.push(() => server.close());
  });
}
