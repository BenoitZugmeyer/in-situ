import { createServer } from "http";
import { readFile } from "fs/promises";
import open from "open";

import log from "../log";
import CLIError from "../CLIError";
import read from "../read";
import readSourceMap from "../readSourceMap";
import { getModuleSizes, ModuleSizeEntry } from "../getModuleSizes";
import { AddressInfo } from "net";

export interface ModulesCommandArguments {
  sourceURL: string;
  consolidateNull: boolean;
  sort: "size" | "path";
  limit: Limit | undefined;
  map: boolean;
}
export type Limit =
  | { type: "count"; count: number }
  | { type: "size"; min: number; max: number };

export default async function modulesCommand({
  sourceURL,
  consolidateNull,
  sort,
  limit,
  map,
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

  if (map) {
    displayMap(moduleSizes);
  } else {
    displayList(moduleSizes);
  }
}

const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

function formatHumanReadable(n: number): string {
  return numberFormat.format(n);
}

function displayList(moduleSizes: ModuleSizeEntry[]) {
  const sizeColumnWidth = formatHumanReadable(
    moduleSizes.reduce(
      (maxSize, { size }) => (maxSize > size ? maxSize : size),
      0
    )
  ).length;

  console.log(`${"size".padEnd(sizeColumnWidth)} | path`);
  for (const { source, size } of moduleSizes) {
    console.log(
      `${formatHumanReadable(size).padStart(sizeColumnWidth)} | ${source}`
    );
  }
}

async function displayMap(moduleSizes: ModuleSizeEntry[]) {
  const server = createServer();
  const frontJs = await readFile(require.resolve("./front.js"));

  server.on("request", (req, res) => {
    switch (req.url) {
      case "/":
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>in-situ module map</title>
  </head>
  <body>
    <div id="app"></div>

    <script>window.MODULE_SIZES = ${JSON.stringify(moduleSizes)};</script>
    <script type="module" src="/main.js"></script>
  </body>
</html>
      `
        );
        break;

      case "/main.js":
        res.writeHead(200, { "Content-Type": "text/javascript" });
        res.end(frontJs);
        break;
    }
  });

  server.on("listening", () => {
    const { address, port } = server.address() as AddressInfo;
    const url = `http://${address}:${port}`;
    log.info(`Server listening at ${url}`);
    open(url);
  });

  server.listen(0, "127.0.0.1");
}
