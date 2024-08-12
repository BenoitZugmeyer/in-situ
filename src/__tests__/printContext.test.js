import { test } from "node:test";

import { __tests__ } from "../printContext.js";

const { formatContext } = __tests__;

test("prints simple source context", ({ assert }) => {
  assert.strictEqual(
    formatContext({ content: "a", position: { line: 1, column: 0 } }),
    "a\n^",
  );
});

test("context limit", ({ assert }) => {
  assert.strictEqual(
    formatContext({
      content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
      position: { line: 7, column: 0 },
    }),
    "b\nc\nd\ne\nf\ng\n^\nh\ni\nj\nk\nl",
  );
  assert.strictEqual(
    formatContext(
      {
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        position: { line: 7, column: 0 },
      },
      { beforeContext: 0 },
    ),
    "g\n^\nh\ni\nj\nk\nl",
  );
  assert.strictEqual(
    formatContext(
      {
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        position: { line: 7, column: 0 },
      },
      { afterContext: 0 },
    ),
    "b\nc\nd\ne\nf\ng\n^",
  );
  assert.strictEqual(
    formatContext(
      {
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        position: { line: 7, column: 0 },
      },
      { beforeContext: 0, afterContext: 0 },
    ),
    "g\n^",
  );
});

test("lastColumn", ({ assert }) => {
  assert.strictEqual(
    formatContext({
      content: "abcdefghi",
      position: { line: 1, column: 1, lastColumn: 4 },
    }),
    "abcdefghi\n ^^^",
  );
});

test("tab", ({ assert }) => {
  assert.strictEqual(
    formatContext({
      content: "\t\tabcdefghi",
      position: { line: 1, column: 2 },
    }),
    "\t\tabcdefghi\n                ^",
  );
});

test("wide character before cursor", ({ assert }) => {
  assert.strictEqual(
    formatContext({
      content: "杨abcdefghi",
      position: { line: 1, column: 1 },
    }),
    "杨abcdefghi\n  ^",
  );
});

test("wide character at cursor", ({ assert }) => {
  assert.strictEqual(
    formatContext({
      content: "abc杨defghi",
      position: { line: 1, column: 3 },
    }),
    "abc杨defghi\n   ^^",
  );
});
