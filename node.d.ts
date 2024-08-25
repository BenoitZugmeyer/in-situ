declare module "node:test" {
  // Redeclaring those types are needed because 'snapshot' is not defined in upstream types and
  // somehow declaration merging doesn't work.
  function test(name?: string, fn?: TestFn): Promise<void>;
  type TestFn = (
    t: TestContext,
    done: (result?: unknown) => void,
  ) => void | Promise<void>;
  export interface TestContext {
    assert: TestContextAssert;
  }
  export interface TestContextAssert {
    snapshot(value: unknown): void;
    deepEqual: typeof import("node:assert").deepEqual;
    deepStrictEqual: typeof import("node:assert").deepStrictEqual;
    doesNotMatch: typeof import("node:assert").doesNotMatch;
    doesNotReject: typeof import("node:assert").doesNotReject;
    doesNotThrow: typeof import("node:assert").doesNotThrow;
    equal: typeof import("node:assert").equal;
    fail: typeof import("node:assert").fail;
    ifError: typeof import("node:assert").ifError;
    match: typeof import("node:assert").match;
    notDeepEqual: typeof import("node:assert").notDeepEqual;
    notDeepStrictEqual: typeof import("node:assert").notDeepStrictEqual;
    notEqual: typeof import("node:assert").notEqual;
    notStrictEqual: typeof import("node:assert").notStrictEqual;
    ok: typeof import("node:assert").ok;
    rejects: typeof import("node:assert").rejects;
    strictEqual: typeof import("node:assert").strictEqual;
    throws: typeof import("node:assert").throws;
  }
}
