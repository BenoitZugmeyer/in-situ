declare module "node:test" {
  import type assert from "node:assert";
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
    deepEqual: typeof assert.deepEqual;
    deepStrictEqual: typeof assert.deepStrictEqual;
    doesNotMatch: typeof assert.doesNotMatch;
    doesNotReject: typeof assert.doesNotReject;
    doesNotThrow: typeof assert.doesNotThrow;
    equal: typeof assert.equal;
    fail: typeof assert.fail;
    ifError: typeof assert.ifError;
    match: typeof assert.match;
    notDeepEqual: typeof assert.notDeepEqual;
    notDeepStrictEqual: typeof assert.notDeepStrictEqual;
    notEqual: typeof assert.notEqual;
    notStrictEqual: typeof assert.notStrictEqual;
    ok: typeof assert.ok;
    rejects: typeof assert.rejects;
    strictEqual: typeof assert.strictEqual;
    throws: typeof assert.throws;
  }
}
