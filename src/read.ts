import url from "url";
import path from "path";
import fs from "fs/promises";

import log from "./log.js";

export interface ReadResult {
  content: string;
  headers: {
    get(name: string): string | undefined | null;
    has(name: string): boolean;
  };
  readRelative(location: string): Promise<ReadResult>;
}

export default function read(location: string): Promise<ReadResult> {
  return isRemoteUrl(location) ? readRemote(location) : readLocal(location);
}

function isRemoteUrl(location: string) {
  return location.startsWith("http://") || location.startsWith("https://");
}

async function readRemote(location: string): Promise<ReadResult> {
  log.debug(`Read remote file ${location}`);
  const response = await fetch(location);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  return {
    content: await response.text(),
    headers: response.headers,
    readRelative(relativePath) {
      return readRemote(url.resolve(location, relativePath));
    },
  };
}

async function readLocal(location: string): Promise<ReadResult> {
  log.debug(`Read local file ${location}`);
  return {
    content: await fs.readFile(location, { encoding: "utf-8" }),
    headers: new Map(),
    readRelative(relativePath: string) {
      return readLocal(path.join(path.dirname(location), relativePath));
    },
  };
}
