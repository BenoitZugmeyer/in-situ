import type { ReadResult } from "./read.ts";

export interface Configuration {
  debug: boolean;
  sourceURL: string;
  position: Position;
  useSourceMap: boolean;
  beforeContext: number;
  afterContext: number;
}

export interface Position {
  line: number;
  column: number;
}

export interface ResolvedPosition extends Position {
  lastColumn?: number;
}

export interface InputSource {
  readResult: ReadResult;
  position: Position;
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
  position: ResolvedPosition;
  fileName: string | undefined;
  content: string;
}
