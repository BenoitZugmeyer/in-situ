import parseArguments from "../parseArguments.js";

let stdout: jest.SpyInstance<
  boolean,
  [str: string | Uint8Array, encoding?: any, cb?: any]
>;
beforeEach(() => {
  jest.spyOn(process, "exit").mockImplementation((status) => {
    throw new Error(`exit ${status}`);
  });
  stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
});

test("parseArguments", () => {
  expect(() =>
    parseArguments(`x x`.split(" "))
  ).toThrowErrorMatchingInlineSnapshot(`"exit undefined"`);
  expect(stdout.mock.calls[0][0]).toMatchInlineSnapshot(`
    "Usage: in-situ [options] <URL:LINE:COLUMN>

    Download, beautify and print lines from a minified JavaScript source

    Options:
      -A, --after-context <num>   print <num> lines of trailing context after the selected line
      -B, --before-context <num>  print <num> lines of leading context before the selected line
      -C, --context <num>         print <num> lines of leading and trailing context surrounding the selected line
      --no-source-map             don't try to use a source map
      -d, --debug                 output extra debugging
      -V, --version               output the version number
      -h, --help                  output usage information
    "
  `);

  expect(() =>
    parseArguments(`x x --version`.split(" "))
  ).toThrowErrorMatchingInlineSnapshot(`"exit 0"`);
  expect(stdout).lastCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+.*\n$/));

  expect(parseArguments(`x x https://foo.com:1:1`.split(" "))).toEqual({
    debug: undefined,
    sourceURL: "https://foo.com",
    position: { line: 1, column: 1 },
    beforeContext: undefined,
    afterContext: undefined,
    useSourceMap: true,
  });

  expect(parseArguments(`x x -C 2 https://foo.com:1:1`.split(" "))).toEqual(
    expect.objectContaining({
      beforeContext: 2,
      afterContext: 2,
    })
  );

  expect(parseArguments(`x x -d https://foo.com:1:1`.split(" "))).toEqual(
    expect.objectContaining({
      debug: true,
    })
  );
});
