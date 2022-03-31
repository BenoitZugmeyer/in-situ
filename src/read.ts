import fetch from "node-fetch";
import url from "url";
import path from "path";
import fs from "fs/promises";

import log from "./log";

export interface File {
  content: string;
  headers: {
    get(name: string): string | undefined | null;
    has(name: string): boolean;
  };
  readRelative(location: string): Promise<File>;
}

export default function read(location: string): Promise<File> {
  return isRemoteUrl(location) ? readRemote(location) : readLocal(location);
}

function isRemoteUrl(location: string) {
  return location.startsWith("http://") || location.startsWith("https://");
}

async function readRemote(location: string): Promise<File> {
  log.debug(`Read remote file ${location}`);
  const response = await fetch(location);
  if (response.status !== 200) {
    throw new Error(`Failed to fetch: ${response.statusText}`);
  }

  const content = await response.text();

  return {
    content,
    headers: response.headers,
    readRelative(relativePath: string) {
      return readRemote(url.resolve(location, relativePath));
    },
  };
}

async function readLocal(location: string): Promise<File> {
  log.debug(`Read local file ${location}`);
  const content = await fs.readFile(location, { encoding: "utf-8" });
  return {
    content,
    headers: new Map(),
    readRelative(relativePath: string) {
      return readLocal(path.join(path.dirname(location), relativePath));
    },
  };
}
