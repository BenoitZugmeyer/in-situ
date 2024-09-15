import { test, describe } from "node:test";
import type { TestContext } from "node:test";

import parseArguments from "./parseArguments.ts";
import CLIError from "./CLIError.ts";

describe("parseArguments", () => {
  test("empty arguments", (t: TestContext) => {
    t.assert.throws(
      () => parseArguments([]),
      new CLIError(
        "Missing positional argument URL:LINE:COLUMN. Use --help for documentation.",
      ),
    );
  });

  test("--version", (t: TestContext) => {
    t.assert.deepStrictEqual(parseArguments(["--version"]), {
      command: "version",
    });
    t.assert.deepStrictEqual(parseArguments(["-V"]), {
      command: "version",
    });
  });

  test("--help", (t: TestContext) => {
    t.assert.deepStrictEqual(parseArguments(["--help"]), {
      command: "help",
    });
    t.assert.deepStrictEqual(parseArguments(["--help", "toto"]), {
      command: "help",
    });
    t.assert.deepStrictEqual(parseArguments(["toto", "--help"]), {
      command: "help",
    });
    t.assert.deepStrictEqual(parseArguments(["-h"]), {
      command: "help",
    });
  });

  test("defaults", (t: TestContext) => {
    t.assert.deepStrictEqual(parseArguments([`https://foo.com:1:1`]), {
      command: "context",
      configuration: {
        debug: false,
        sourceURL: "https://foo.com",
        location: { line: 1, column: 1 },
        useSourceMap: true,
        beforeContext: 5,
        afterContext: 5,
      },
    });
  });

  test("URL and location", (t: TestContext) => {
    const parsedArguments = parseArguments([`https://foo.com:42:12`]);
    t.assert.strictEqual(parsedArguments.command, "context");
    t.assert.strictEqual(
      parsedArguments.configuration.sourceURL,
      "https://foo.com",
    );
    t.assert.deepStrictEqual(parsedArguments.configuration.location, {
      line: 42,
      column: 12,
    });
  });

  test("use source maps", (t: TestContext) => {
    const parsedArguments = parseArguments([
      `--no-source-map`,
      `https://foo.com:1:1`,
    ]);
    t.assert.strictEqual(parsedArguments.command, "context");
    t.assert.strictEqual(parsedArguments.configuration.useSourceMap, false);
  });

  test("context", (t: TestContext) => {
    const parsedArguments = parseArguments([`-C`, `2`, `https://foo.com:1:1`]);
    t.assert.strictEqual(parsedArguments.command, "context");
    t.assert.strictEqual(parsedArguments.configuration.beforeContext, 2);
    t.assert.strictEqual(parsedArguments.configuration.afterContext, 2);
  });

  test("--debug", (t: TestContext) => {
    const parsedArguments = parseArguments([`--debug`, `https://foo.com:1:1`]);
    t.assert.strictEqual(parsedArguments.command, "context");
    t.assert.strictEqual(parsedArguments.configuration.debug, true);
  });
});
