import { test, afterEach, describe, before, type TestContext } from "node:test";
import { promisify } from "util";
import path from "path";
import childProcess from "child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "fs";
import http from "http";
import type { AddressInfo } from "net";

const spawn = childProcess.spawn;
const execFile = promisify(childProcess.execFile);

// generated with
// npx terser index.js --mangle -o bundle.min.js -e --toplevel --source-map includeSources
const generatedCode =
  "(function(){const o=document.title;console.log('\t',o);window.杨=o})();";

const sourceMap = JSON.stringify({
  version: 3,
  file: "bundle.min.js",
  sources: ["index.js"],
  names: ["title", "document", "console", "log", "window", "杨"],
  mappings: "YAAA,MAAMA,EAAQC,SAASD,MACvBE,QAAQC,IAAI,KAAKH,GACjBI,OAAOC,EAAIL",
  sourcesContent: [
    "const title = document.title\nconsole.log('\t', title)\nwindow.杨 = title\n",
  ],
});

before(async () => {
  await execFile("./tools/build.ts");
});

const cleanupCallbacks: Array<() => void> = [];
afterEach(() => {
  cleanupCallbacks.forEach((cleanupCallback) => cleanupCallback());
  cleanupCallbacks.length = 0;
});

test("fails if no argument is given", async (t: TestContext) => {
  t.assert.deepStrictEqual(await runBin(), {
    code: 1,
    stderr: `Missing positional argument LOCATION. Use --help for documentation.\n`,
    stdout: "",
  });
});

test("fails if invalid argument is given", async (t: TestContext) => {
  t.assert.deepStrictEqual(await runBin("-x"), {
    code: 1,
    stderr: `Unknown option '-x'. To specify a positional argument starting with a '-', place it at the end of the command after '--', as in '-- "-x"\n`,
    stdout: "",
  });
});

test("context options", async (t: TestContext) => {
  const url = await withServer({
    "/": generatedCode,
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-C", "1"), {
    code: 0,
    stderr: r`
      Fetching source code...
      Beautifying source code...
      `,
    stdout: r(6)`
          const o = document.title;
          console.log("\t", o);
                            ^
          window.杨 = o;
      `,
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-C", "0"), {
    code: 0,
    stderr: r`
      Fetching source code...
      Beautifying source code...
      `,
    stdout: r(6)`
          console.log("\t", o);
                            ^
      `,
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-A", "0"), {
    code: 0,
    stderr: r`
      Fetching source code...
      Beautifying source code...
      `,
    stdout: r`
      (function() {
          const o = document.title;
          console.log("\t", o);
                            ^
      `,
  });
  t.assert.deepStrictEqual(await runBin(`${url}:1:53`, "-B", "0"), {
    code: 0,
    stderr: r`
      Fetching source code...
      Beautifying source code...
      `,
    stdout: r(6)`
          console.log("\t", o);
                            ^
          window.杨 = o;
      })();
      `,
  });
});

describe("code beautifier", () => {
  test("beautifies code", async (t: TestContext) => {
    const url = await withServer({
      "/": generatedCode,
    });
    t.assert.deepStrictEqual(await runBin(`${url}:1:53`), {
      code: 0,
      stderr: r`
        Fetching source code...
        Beautifying source code...
        `,
      stdout: r`
        (function() {
            const o = document.title;
            console.log("\t", o);
                              ^
            window.杨 = o;
        })();
        `,
    });
  });

  test("fail if the code has a syntax error", async (t: TestContext) => {
    const url = await withServer({
      "/": "<html>",
    });
    t.assert.deepStrictEqual(await runBin(`${url}:1:53`), {
      code: 1,
      stderr: r`
        Fetching source code...
        Beautifying source code...
        Failed to parse response: SyntaxError: Unexpected token: operator (<)
        `,
      stdout: "",
    });
  });
});

describe("source map retrieval", () => {
  async function testSourceMapRetrieval(
    title: string,
    {
      serve,
      files,
      expect: {
        fetchSourceMaps = true,
        fetchSourceMapsError = "",
        useBeautify = false,
      } = {},
      args = [],
    }: {
      serve?: MockResponses;
      files?: Files;
      expect?: {
        fetchSourceMaps?: boolean;
        fetchSourceMapsError?: string;
        useBeautify?: boolean;
      };
      args?: string[];
    },
  ) {
    test(title, async (t: TestContext) => {
      let prefix: string;
      if (serve) {
        prefix = await withServer(serve);
      } else if (files) {
        prefix = withDirectory(files);
      } else {
        throw new Error("Either serve or files must be provided");
      }

      const statuses = ["Fetching source code..."];
      if (fetchSourceMaps) {
        statuses.push("Fetching source maps...");
      }
      if (fetchSourceMapsError) {
        statuses.push(
          `Failed to fetch source map: ${fetchSourceMapsError.replaceAll("<prefix>", prefix)}`,
        );
      }
      if (useBeautify) {
        statuses.push("Beautifying source code...");
      }

      t.assert.deepStrictEqual(
        await runBin(`${prefix}/bundle.min.js:1:64`, ...args),
        {
          code: 0,
          stderr: `${statuses.join("\n")}\n`,
          stdout: useBeautify
            ? r`
            (function() {
                const o = document.title;
                console.log("\t", o);
                window.杨 = o;
                            ^
            })();
            `
            : r`
            File: index.js
            const title = document.title
            console.log('	', title)
            window.杨 = title
                        ^

            `,
        },
      );
    });
  }

  describe("from an http URL", () => {
    testSourceMapRetrieval("use the source map from a sourcemap comment", {
      serve: {
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        "/bundle.min.js.map": sourceMap,
      },
    });

    testSourceMapRetrieval("use the source map from a X-SourceMap header", {
      serve: {
        "/bundle.min.js": {
          body: generatedCode,
          headers: { "X-SourceMap": "bundle.min.js.map" },
        },
        "/bundle.min.js.map": sourceMap,
      },
    });

    testSourceMapRetrieval("use the source map from a SourceMap header", {
      serve: {
        "/bundle.min.js": {
          body: generatedCode,
          headers: { SourceMap: "bundle.min.js.map" },
        },
        "/bundle.min.js.map": sourceMap,
      },
    });

    const base64EncodedSourceMap = Buffer.from(sourceMap).toString("base64");
    testSourceMapRetrieval("use the source map from a data-uri", {
      serve: {
        "/bundle.min.js": `${generatedCode}\n//@ sourceMappingURL=data:application/json;charset=utf-8;base64,${base64EncodedSourceMap}`,
      },
      expect: {
        fetchSourceMaps: false,
      },
    });

    testSourceMapRetrieval(
      "fallback to beautify if the source map is not found",
      {
        serve: {
          "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        },
        expect: {
          fetchSourceMapsError: "Error: Failed to fetch: Not found",
          useBeautify: true,
        },
      },
    );

    testSourceMapRetrieval("no source map option", {
      serve: {
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        "/bundle.min.js.map": sourceMap,
      },
      args: ["--no-source-map"],
      expect: {
        fetchSourceMaps: false,
        useBeautify: true,
      },
    });
  });

  describe("from a local file", () => {
    testSourceMapRetrieval("use the source map from a sourcemap comment", {
      files: {
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        "/bundle.min.js.map": sourceMap,
      },
    });

    const base64EncodedSourceMap = Buffer.from(sourceMap).toString("base64");
    testSourceMapRetrieval("use the source map from a data-uri", {
      files: {
        "/bundle.min.js": `${generatedCode}\n//@ sourceMappingURL=data:application/json;charset=utf-8;base64,${base64EncodedSourceMap}`,
      },
      expect: {
        fetchSourceMaps: false,
      },
    });

    testSourceMapRetrieval(
      "fallback to beautify if the source map is not found",
      {
        files: {
          "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        },
        expect: {
          fetchSourceMapsError:
            "Error: ENOENT: no such file or directory, open '<prefix>/bundle.min.js.map'",
          useBeautify: true,
        },
      },
    );

    testSourceMapRetrieval("no source map option", {
      files: {
        "/bundle.min.js": `${generatedCode}\n//# sourceMappingURL=bundle.min.js.map`,
        "/bundle.min.js.map": sourceMap,
      },
      args: ["--no-source-map"],
      expect: {
        fetchSourceMaps: false,
        useBeautify: true,
      },
    });
  });
});

describe("README examples", () => {
  const readmeContent = readFileSync("./README.md", {
    encoding: "utf-8",
  });

  const usage = readmeContent.match(/## Usage\n\n```\n(.*?)```/s)![1];
  const [, exampleCommand, exampleOutput] = readmeContent.match(
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
  return new Promise<string>((resolve, reject) => {
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

type Files = Record<string, string>;
function withDirectory(files: Files) {
  const directory = mkdtempSync("in-situ-test-");
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(path.join(directory, name), content);
  }
  cleanupCallbacks.push(() => rmSync(directory, { recursive: true }));
  return directory;
}

function r(template: TemplateStringsArray): string;
function r(dedentSize: number): (template: TemplateStringsArray) => string;
function r(
  arg: number | TemplateStringsArray,
): string | ((template: TemplateStringsArray) => string) {
  if (typeof arg === "number") {
    return (template) => dedent(arg, template);
  } else {
    return dedent(undefined, arg);
  }

  function dedent(
    deindentSize: number | undefined,
    template: TemplateStringsArray,
  ): string {
    // dedent the template string
    const lines = template.raw[0].split("\n");
    if (lines[0] === "") {
      lines.shift();
    }
    const indent = deindentSize
      ? " ".repeat(deindentSize)
      : lines[0].match(/^\s*/)![0];
    return lines.map((line) => line.replace(indent, "")).join("\n");
  }
}
