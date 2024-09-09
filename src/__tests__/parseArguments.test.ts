import { test, mock } from "node:test";
import type { TestContext } from "node:test";

import parseArguments from "../parseArguments.ts";

test("parseArguments", (t: TestContext) => {
  {
    const { stdout, exit } = withStdout(() => {
      parseArguments(`x x`.split(" "));
    });
    t.assert.snapshot(stdout);
    t.assert.deepStrictEqual(exit, {
      status: 1,
    });
  }

  {
    const { stdout, exit } = withStdout(() => {
      parseArguments(`--version`.split(" "));
    });
    t.assert.deepStrictEqual(exit, { status: 0 });
    t.assert.match(stdout, /^\d+\.\d+\.\d+.*\n$/);
  }

  t.assert.deepStrictEqual(parseArguments(`https://foo.com:1:1`.split(" ")), {
    debug: false,
    sourceURL: "https://foo.com",
    position: { line: 1, column: 1 },
    beforeContext: 5,
    afterContext: 5,
    useSourceMap: true,
  });

  const parsedArguments = parseArguments(`-C 2 https://foo.com:1:1`.split(" "));
  t.assert.strictEqual(parsedArguments.beforeContext, 2);
  t.assert.strictEqual(parsedArguments.afterContext, 2);

  t.assert.strictEqual(
    parseArguments(`-d https://foo.com:1:1`.split(" ")).debug,
    true,
  );
});

function withStdout(fn: () => void) {
  // Make sure to restore the mocks as soon as possible so nodejs test runner can actually write to
  // stdout.
  const writeMock = mock.method(process.stdout, "write", () => true);
  const exitMock = mock.method(process, "exit", () => {
    throw new Error("exit");
  });
  let result;
  try {
    fn();
  } catch {
    // Ignore
  } finally {
    result = {
      stdout: writeMock.mock.calls.map((call) => call.arguments[0]).join(""),
      exit:
        exitMock.mock.calls.length > 0
          ? { status: exitMock.mock.calls[0].arguments[0] }
          : undefined,
    };
    exitMock.mock.restore();
    writeMock.mock.restore();
  }
  return result;
}
