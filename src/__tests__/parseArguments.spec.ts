import parseArguments from "../parseArguments";

type WriteSpy = jest.SpyInstance<
  ReturnType<typeof process.stdout.write>,
  Parameters<typeof process.stdout.write>
>;
let stdout: WriteSpy;
let stderr: WriteSpy;

beforeEach(() => {
  jest.spyOn(process, "exit").mockImplementation((status) => {
    throw new Error(`exit ${status}`);
  });
  stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  stderr = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
});

describe("parseArguments", () => {
  test("no argument", () => {
    expect(() =>
      parseArguments(`x x`.split(" "))
    ).toThrowErrorMatchingInlineSnapshot(`"exit 1"`);
    expect(stderr.mock.calls[0][0]).toMatchInlineSnapshot(`
          "error: missing required argument 'URL:LINE:COLUMN'
          "
      `);
  });

  test("help", () => {
    expect(() =>
      parseArguments(`x x --help`.split(" "))
    ).toThrowErrorMatchingInlineSnapshot(`"exit 0"`);
    expect(stdout.mock.calls[0][0]).toMatchInlineSnapshot(`
      "Usage: in-situ [options] [command]

      Download, beautify and print lines from a minified JavaScript source

      Options:
        -V, --version                        output the version number
        -d, --debug                          output extra debugging
        -h, --help                           display help for command

      Commands:
        context [options] <URL:LINE:COLUMN>
        modules [options] <URL>
        help [command]                       display help for command
      "
    `);
  });

  test("version", () => {
    expect(() =>
      parseArguments(`x x --version`.split(" "))
    ).toThrowErrorMatchingInlineSnapshot(`"exit 0"`);
    expect(stdout).lastCalledWith(expect.stringMatching(/^\d+\.\d+\.\d+.*\n$/));
  });

  test("context subcommand", () => {
    expect(parseArguments(`x x https://foo.com:1:1`.split(" "))).toEqual({
      debug: undefined,
      command: "context",
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

    expect(
      parseArguments(`x x --no-source-map https://foo.com:1:1`.split(" "))
    ).toEqual(
      expect.objectContaining({
        useSourceMap: false,
      })
    );
  });

  test("modules subcommand", () => {
    expect(parseArguments(`x x modules https://foo.com`.split(" "))).toEqual({
      debug: undefined,
      command: "modules",
      sourceURL: "https://foo.com",
      consolidateNull: true,
      limit: undefined,
      sort: "size",
    });

    expect(parseArguments(`x x -d modules https://foo.com`.split(" "))).toEqual(
      expect.objectContaining({
        command: "modules",
        debug: true,
      })
    );

    expect(parseArguments(`x x modules -d https://foo.com`.split(" "))).toEqual(
      expect.objectContaining({
        command: "modules",
        debug: true,
      })
    );
  });
});
