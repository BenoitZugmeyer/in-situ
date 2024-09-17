import test, { type TestContext } from "node:test";
import resolveGridLocation from "./resolveGridLocation.ts";

test("returns the same location if it is already a grid location", (t: TestContext) => {
  const location = { line: 1, column: 1 };
  t.assert.deepStrictEqual(resolveGridLocation(location, ""), location);
});

test("start", (t: TestContext) => {
  t.assert.deepStrictEqual(resolveGridLocation({ position: 0 }, "a"), {
    line: 1,
    column: 1,
  });
});

test("multiple lines", (t: TestContext) => {
  t.assert.deepStrictEqual(resolveGridLocation({ position: 0 }, "a\nbc\ndef"), {
    line: 1,
    column: 1,
  });
  t.assert.deepStrictEqual(resolveGridLocation({ position: 2 }, "a\nbc\ndef"), {
    line: 2,
    column: 1,
  });
  t.assert.deepStrictEqual(resolveGridLocation({ position: 3 }, "a\nbc\ndef"), {
    line: 2,
    column: 2,
  });
  t.assert.deepStrictEqual(resolveGridLocation({ position: 5 }, "a\nbc\ndef"), {
    line: 3,
    column: 1,
  });
  t.assert.deepStrictEqual(resolveGridLocation({ position: 6 }, "a\nbc\ndef"), {
    line: 3,
    column: 2,
  });
  t.assert.deepStrictEqual(resolveGridLocation({ position: 7 }, "a\nbc\ndef"), {
    line: 3,
    column: 3,
  });
});

test("CRLF line endings", (t: TestContext) => {
  t.assert.deepStrictEqual(resolveGridLocation({ position: 3 }, "a\r\nbc"), {
    line: 2,
    column: 1,
  });
});

test("CR line endings", (t: TestContext) => {
  t.assert.deepStrictEqual(resolveGridLocation({ position: 2 }, "a\rbc"), {
    line: 2,
    column: 1,
  });
});

test("end of content", (t: TestContext) => {
  t.assert.deepStrictEqual(resolveGridLocation({ position: 3 }, "abc"), {
    line: 1,
    column: 4,
  });
});

test("line break at position", (t: TestContext) => {
  t.assert.throws(() => {
    resolveGridLocation({ position: 2 }, "ab\nc");
  });
  t.assert.throws(() => {
    resolveGridLocation({ position: 2 }, "ab\rc");
  });
  t.assert.throws(() => {
    resolveGridLocation({ position: 2 }, "ab\r\nc");
  });
  t.assert.throws(() => {
    resolveGridLocation({ position: 3 }, "ab\r\nc");
  });
});
