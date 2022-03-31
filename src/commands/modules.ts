import log from "../log";
import CLIError from "../CLIError";
import read from "../read";
import readSourceMap from "../readSourceMap";
import { getModuleSizes, ModuleSizeEntry } from "../getModuleSizes";

export interface ModulesCommandArguments {
  sourceURL: string;
  consolidateNull: boolean;
  sort: "size" | "path";
  limit: Limit | undefined;
}
export type Limit =
  | { type: "count"; count: number }
  | { type: "size"; min: number; max: number };

export default async function modulesCommand({
  sourceURL,
  consolidateNull,
  sort,
  limit,
}: ModulesCommandArguments) {
  log.status("Fetching source code...");

  let bundle;
  try {
    bundle = await read(sourceURL);
  } catch (e) {
    throw new CLIError(`Failed to fetch source code: ${e}`);
  }

  log.status("Fetching source map...");
  const sourceMap = await readSourceMap(bundle);
  if (!sourceMap) {
    throw new CLIError("No source map found");
  }

  log.status();

  let moduleSizes = await getModuleSizes(
    bundle.content,
    sourceMap,
    consolidateNull
  );

  let compare =
    sort === "size"
      ? (a: ModuleSizeEntry, b: ModuleSizeEntry) => b.size - a.size
      : (a: ModuleSizeEntry, b: ModuleSizeEntry) =>
          a.source === null
            ? -1
            : b.source === null
            ? 1
            : a.source > b.source
            ? 1
            : -1;
  moduleSizes.sort(compare);

  const sizeColumnWidth = formatHumanReadable(
    moduleSizes.reduce(
      (maxSize, { size }) => (maxSize > size ? maxSize : size),
      0
    )
  ).length;

  if (limit) {
    switch (limit.type) {
      case "size":
        moduleSizes = moduleSizes.filter(
          ({ size }) => limit.min < size && size < limit.max
        );
        break;
      case "count":
        if (limit.count >= 0) {
          moduleSizes = moduleSizes.slice(0, limit.count);
        } else {
          moduleSizes = moduleSizes.slice(limit.count);
        }
        break;
    }
  }
  console.log(`${"size".padEnd(sizeColumnWidth)} | path`);
  for (const { source, size } of moduleSizes) {
    console.log(
      `${formatHumanReadable(size).padStart(sizeColumnWidth)} | ${source}`
    );
  }
}

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatHumanReadable(n: number): string {
  return numberFormat.format(n);
}
