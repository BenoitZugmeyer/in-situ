import { test, afterEach, describe, before, type TestContext } from "node:test";
import { promisify } from "util";
import childProcess from "child_process";
import { readFileSync } from "fs";
import http from "http";
import type { AddressInfo } from "net";

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

const cleanupCallbacks: Array<() => void> = [];
afterEach(() => {
  cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
  cleanupCallbacks.length = 0;
});

test("fails if no argument is given", async (t: TestContext) => {
  t.assert.deepStrictEqual(await runBin(), {
    code: 0,
    stderr: ``,
    stdout:
      "Usage: in-situ [options] <URL:LINE:COLUMN>\n" +
      "\n" +
      "Download, beautify and print lines from a minified JavaScript source\n" +
      "\n" +
      "Options:\n" +
      "  -A, --after-context <num>   print <num> lines of trailing context after the selected line\n" +
      "  -B, --before-context <num>  print <num> lines of leading context before the selected line\n" +
      "  -C, --context <num>         print <num> lines of leading and trailing context surrounding the selected line\n" +
      "  --no-source-map             don't try to use a source map\n" +
      "  -d, --debug                 output extra debugging\n" +
      "  -V, --version               output the version number\n" +
      "  -h, --help                  output usage information\n",
  });
});

test("context options", async (t: TestContext) => {
  const url = await withServer({
    "/": generatedCode,
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-C", "1"), {
    code: 0,
    stderr: "Fetching source code...\nBeautifying source code...\n",
    stdout:
      "    const o = document.title;\n" +
      "    console.log(`\\t`, o);\n" +
      "                      ^\n" +
      "    window.杨 = o;\n",
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-C", "0"), {
    code: 0,
    stderr: "Fetching source code...\nBeautifying source code...\n",
    stdout: "    console.log(`\\t`, o);\n" + "                      ^\n",
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-A", "0"), {
    code: 0,
    stderr: "Fetching source code...\nBeautifying source code...\n",
    stdout:
      "(function() {\n" +
      "    const o = document.title;\n" +
      "    console.log(`\\t`, o);\n" +
      "                      ^\n",
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-B", "0"), {
    code: 0,
    stderr: "Fetching source code...\nBeautifying source code...\n",
    stdout:
      "    console.log(`\\t`, o);\n                      ^\n    window.杨 = o;\n})();\n",
  });
});

describe("code beautifier", () => {
  test("beautifies code", async (t: TestContext) => {
    const url = await withServer({
      "/": generatedCode,
    });
    t.assert.deepStrictEqual(await runBin(`${url}:1:53`), {
      code: 0,
      stderr: "Fetching source code...\nBeautifying source code...\n",
      stdout:
        "(function() {\n" +
        "    const o = document.title;\n" +
        "    console.log(`\\t`, o);\n" +
        "                      ^\n" +
        "    window.杨 = o;\n" +
        "})();\n",
    });
  });

  test("fail if the code has a syntax error", async (t: TestContext) => {
    const url = await withServer({
      "/": "<html>",
    });
    t.assert.deepStrictEqual(await runBin(`${url}:1:53`), {
      code: 1,
      stderr:
        "Fetching source code...\n" +
        "Beautifying source code...\n" +
        "Failed to parse response: SyntaxError: Unexpected token: operator (<)\n",
      stdout: "",
    });
  });
});

describe("source map retrieval", () => {
  async function testSourceMapRetrieval(responses: MockResponses) {
    const url = await withServer(responses);
    return await runBin(`${url}/bundle.min.js:1:64`);
  }

  test("use the source map from a sourcemap comment", async (t: TestContext) => {
    t.assert.deepStrictEqual(
      await testSourceMapRetrieval({
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        "/bundle.min.js.map": sourceMap,
      }),
      {
        code: 0,
        stderr: "Fetching source code...\nFetching source maps...\n",
        stdout:
          "File: index.js\n" +
          "const title = document.title\n" +
          "console.log(`\t`, title)\n" +
          "window.杨 = title\n" +
          "            ^\n" +
          "\n",
      },
    );
  });

  test("use the source map from a X-SourceMap header", async (t: TestContext) => {
    t.assert.deepStrictEqual(
      await testSourceMapRetrieval({
        "/bundle.min.js": {
          body: generatedCode,
          headers: { "X-SourceMap": "bundle.min.js.map" },
        },
        "/bundle.min.js.map": sourceMap,
      }),
      {
        code: 0,
        stderr: "Fetching source code...\nFetching source maps...\n",
        stdout:
          "File: index.js\n" +
          "const title = document.title\n" +
          "console.log(`\t`, title)\n" +
          "window.杨 = title\n" +
          "            ^\n" +
          "\n",
      },
    );
  });

  test("use the source map from a SourceMap header", async (t: TestContext) => {
    t.assert.deepStrictEqual(
      await testSourceMapRetrieval({
        "/bundle.min.js": {
          body: generatedCode,
          headers: { SourceMap: "bundle.min.js.map" },
        },
        "/bundle.min.js.map": sourceMap,
      }),
      {
        code: 0,
        stderr: "Fetching source code...\nFetching source maps...\n",
        stdout:
          "File: index.js\n" +
          "const title = document.title\n" +
          "console.log(`\t`, title)\n" +
          "window.杨 = title\n" +
          "            ^\n" +
          "\n",
      },
    );
  });

  test("use the source map from a data-uri", async (t: TestContext) => {
    const base64EncodedSourceMap = Buffer.from(sourceMap).toString("base64");
    t.assert.deepStrictEqual(
      await testSourceMapRetrieval({
        "/bundle.min.js": `${generatedCode}\n//@ sourceMappingURL=data:application/json;charset=utf-8;base64,${base64EncodedSourceMap}`,
      }),
      {
        code: 0,
        stderr: "Fetching source code...\n",
        stdout:
          "File: index.js\n" +
          "const title = document.title\n" +
          "console.log(`\t`, title)\n" +
          "window.杨 = title\n" +
          "            ^\n" +
          "\n",
      },
    );
  });

  test("fallback to beautify if the source map is not found", async (t: TestContext) => {
    t.assert.deepStrictEqual(
      await testSourceMapRetrieval({
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
      }),
      {
        code: 0,
        stderr:
          "Fetching source code...\n" +
          "Fetching source maps...\n" +
          "Failed to fetch source map: Error: Failed to fetch: Not found\n" +
          "Beautifying source code...\n",
        stdout:
          "(function() {\n" +
          "    const o = document.title;\n" +
          "    console.log(`\\t`, o);\n" +
          "    window.杨 = o;\n" +
          "                ^\n" +
          "})();\n",
      },
    );
  });

  test("no source map option", async (t: TestContext) => {
    const url = await withServer({
      "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
      "/bundle.min.js.map": sourceMap,
    });
    t.assert.deepStrictEqual(
      await runBin(`${url}/bundle.min.js:1:64`, "--no-source-map"),
      {
        code: 0,
        stderr: `\
Fetching source code...
Beautifying source code...
`,
        stdout: `\
(function() {
    const o = document.title;
    console.log(\`\\t\`, o);
    window.杨 = o;
                ^
})();
`,
      },
    );
  });
});

describe("README examples", () => {
  const readmeContent = readFileSync("./README.md", {
    encoding: "utf-8",
  });

  const usage = readmeContent.match(/## Usage\n\n```\n(.*?)```/s)![1];
  const [_, exampleCommand, exampleOutput] = readmeContent.match(
    /## Example\n\n```\nin-situ (.*?)\n```\n\n```js\n(.*?)```/s,
  )!;

  test("usage format", async (t: TestContext) => {
    t.assert.deepStrictEqual(await runBin("--help"), {
      code: 0,
      stdout: usage,
      stderr: "",
    });
  });

  test("example", async (t: TestContext) => {
    const result = await runBin(...exampleCommand.split(" "));
    t.assert.deepStrictEqual(
      result.stdout.replace(/\t/g, "        "),
      exampleOutput,
    );
  });
});

async function runBin(
  ...args: string[]
): Promise<{ code: number | null; stderr: string; stdout: string }> {
  return new Promise((resolve) => {
    const process = spawn("node", ["./main.js", ...args]);

    const stderr: Buffer[] = [];
    const stdout: Buffer[] = [];
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

type MockResponses = Record<
  string,
  string | { body: string; headers: Record<string, string> }
>;

function withServer(responses: MockResponses) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      if (request.url! in responses) {
        const r = responses[request.url!];
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
      const { address, port } = server.address() as AddressInfo;
      resolve(`http://${address}:${port}`);
    });
    cleanupCallbacks.push(() => server.close());
  });
}
