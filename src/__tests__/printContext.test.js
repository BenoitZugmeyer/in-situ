const {
  __tests__: { formatContext },
} = require("../printContext")

test("prints simple source context", () => {
  expect(
    formatContext({ content: "a", position: { line: 1, column: 0 } }),
  ).toBe("a\n^")
})

test("context limit", () => {
  expect(
    formatContext({
      content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
      position: { line: 7, column: 0 },
    }),
  ).toBe("b\nc\nd\ne\nf\ng\n^\nh\ni\nj\nk\nl")
  expect(
    formatContext(
      {
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        position: { line: 7, column: 0 },
      },
      { beforeContext: 0 },
    ),
  ).toBe("g\n^\nh\ni\nj\nk\nl")
  expect(
    formatContext(
      {
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        position: { line: 7, column: 0 },
      },
      { afterContext: 0 },
    ),
  ).toBe("b\nc\nd\ne\nf\ng\n^")
  expect(
    formatContext(
      {
        content: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\nk\nl\nm",
        position: { line: 7, column: 0 },
      },
      { beforeContext: 0, afterContext: 0 },
    ),
  ).toBe("g\n^")
})

test("lastColumn", () => {
  expect(
    formatContext({
      content: "abcdefghi",
      position: { line: 1, column: 1, lastColumn: 4 },
    }),
  ).toBe("abcdefghi\n ^^^")
})

test("tab", () => {
  expect(
    formatContext({
      content: "\t\tabcdefghi",
      position: { line: 1, column: 2 },
    }),
  ).toBe("\t\tabcdefghi\n                ^")
})

test("wide character before cursor", () => {
  expect(
    formatContext({
      content: "杨abcdefghi",
      position: { line: 1, column: 1 },
    }),
  ).toBe("杨abcdefghi\n  ^")
})

test("wide character at cursor", () => {
  expect(
    formatContext({
      content: "abc杨defghi",
      position: { line: 1, column: 3 },
    }),
  ).toBe("abc杨defghi\n   ^^")
})
