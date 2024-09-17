import { test, type TestContext } from "node:test";

import { __tests__ } from "./printContext.ts";

const { formatContext } = __tests__;

test("prints simple source context", (t: TestContext) => {
  t.assert.strictEqual(
    formatContext({
      type: "resolved",
      fileName: undefined,
      content: "a",
      location: { line: 1, column: 0 },
    }),
    "a\n^",
  );
});

test("context limit", (t: TestContext) => {
  t.assert.strictEqual(
    formatContext({
      type: "resolved",
      fileName: undefined,
      content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
      location: { line: 7, column: 0 },
    }),
    "b\nc\nd\ne\nf\ng\n^\nh\ni\nj\nk\nl",
  );
  t.assert.strictEqual(
    formatContext(
      {
        type: "resolved",
        fileName: undefined,
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        location: { line: 7, column: 0 },
      },
      { beforeContext: 0 },
    ),
    "g\n^\nh\ni\nj\nk\nl",
  );
  t.assert.strictEqual(
    formatContext(
      {
        type: "resolved",
        fileName: undefined,
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        location: { line: 7, column: 0 },
      },
      { afterContext: 0 },
    ),
    "b\nc\nd\ne\nf\ng\n^",
  );
  t.assert.strictEqual(
    formatContext(
      {
        type: "resolved",
        fileName: undefined,
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        location: { line: 7, column: 0 },
      },
      { beforeContext: 0, afterContext: 0 },
    ),
    "g\n^",
  );
});

test("lastColumn", (t: TestContext) => {
  t.assert.strictEqual(
    formatContext({
      type: "resolved",
      fileName: undefined,
      content: "abcdefghi",
      location: { line: 1, column: 1, lastColumn: 4 },
    }),
    "abcdefghi\n ^^^",
  );
});

test("tab", (t: TestContext) => {
  t.assert.strictEqual(
    formatContext({
      type: "resolved",
      fileName: undefined,
      content: "\t\tabcdefghi",
      location: { line: 1, column: 2 },
    }),
    "\t\tabcdefghi\n                ^",
  );
});

test("wide character before cursor", (t: TestContext) => {
  t.assert.strictEqual(
    formatContext({
      type: "resolved",
      fileName: undefined,
      content: "杨abcdefghi",
      location: { line: 1, column: 1 },
    }),
    "杨abcdefghi\n  ^",
  );
});

test("wide character at cursor", (t: TestContext) => {
  t.assert.strictEqual(
    formatContext({
      type: "resolved",
      fileName: undefined,
      content: "abc杨defghi",
      location: { line: 1, column: 3 },
    }),
    "abc杨defghi\n   ^^",
  );
});
