import type { ReadResult } from "./read.ts";

export interface Configuration {
  debug: boolean;
  sourceURL: string;
  location: Location;
  useSourceMap: boolean;
  beforeContext: number;
  afterContext: number;
}

export type Location = GridLocation | PositionLocation;

export interface GridLocation {
  line: number;
  column: number;
}

export interface PositionLocation {
  position: number;
}

export interface ResolvedLocation extends GridLocation {
  lastColumn?: number;
}

export interface InputSource {
  readResult: ReadResult;
  location: GridLocation;
}

export type ApplyResult =
  | ResolvedApplyResult
  | {
      type: "file-name-only";
      fileName: string;
    }
  | {
      type: "unresolved";
    };

export interface ResolvedApplyResult {
  type: "resolved";
  location: ResolvedLocation;
  fileName: string | undefined;
  content: string;
}
