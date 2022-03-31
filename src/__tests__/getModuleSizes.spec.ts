import { RawSourceMap } from "source-map";
import {
  computeLineIndexes,
  getIndex,
  getModuleSizes,
} from "../getModuleSizes";
import { readFile } from "fs/promises";

const generatedCode =
  "(function(){const o=document.title;console.log(`\\t`,o);window.杨=o})();";
const sourceMap: RawSourceMap = {
  version: 3,
  sources: ["index.js"],
  names: ["title", "document", "console", "log", "window"],
  mappings: "YAAA,MAAMA,EAAQC,SAASD,MACvBE,QAAQC,IAAI,KAAMH,GAClBI,OAAO,EAAIJ",
  file: "",
};

test("getModuleSizes", async () => {
  expect(await getModuleSizes(generatedCode, sourceMap)).toMatchSnapshot();
});

test("computeLineIndexes", () => {
  expect(computeLineIndexes("foo\nbar")).toEqual([4, 7]);
  expect(computeLineIndexes("foo\n\nbar")).toEqual([4, 5, 8]);
  expect(computeLineIndexes("foo")).toEqual([3]);
});

test("getIndex", () => {
  expect(getIndex([10], { line: 1, column: 0 })).toBe(0);
  expect(getIndex([10], { line: 1, column: 9 })).toBe(9);
  expect(getIndex([10, 20], { line: 2, column: 10 })).toBe(20);
  expect(() => getIndex([10], { line: 2, column: 0 })).toThrowError();
  expect(() => getIndex([10], { line: 1, column: -1 })).toThrowError();
  expect(() => getIndex([10], { line: 1, column: 15 })).toThrowError();
  expect(() => getIndex([10], { line: 1, column: 10 })).toThrowError();
});
