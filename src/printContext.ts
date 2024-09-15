import readline from "readline";
import cardinal from "cardinal";

import log from "./log.ts";
import type { Configuration, ResolvedApplyResult } from "./types.ts";

export default function printContext(
  source: ResolvedApplyResult,
  {
    beforeContext,
    afterContext,
  }: Pick<Configuration, "beforeContext" | "afterContext">,
) {
  log.status();

  console.log(
    formatContext(source, {
      beforeContext,
      afterContext,
      shouldHighlight: process.stdout.isTTY,
    }),
  );
}

function formatContext(
  {
    content,
    fileName,
    location: { line, column, lastColumn },
  }: ResolvedApplyResult,
  {
    shouldHighlight = false,
    beforeContext = 5,
    afterContext = 5,
  }: {
    shouldHighlight?: boolean;
    beforeContext?: number;
    afterContext?: number;
  } = {},
) {
  if (!lastColumn) {
    lastColumn = column + 1;
  }

  const highlight = shouldHighlight
    ? (code: string) => {
        try {
          return cardinal.highlight(code);
        } catch {
          return code;
        }
      }
    : (code: string) => code;

  const lines = content.split("\n");
  const before = lines.slice(Math.max(line - (beforeContext + 1), 0), line);
  const after = lines.slice(line, line + afterContext);

  let output = "";

  if (fileName) {
    output += `File: ${fileName}\n`;
  }

  output += `${highlight(before.join("\n"))}\n`;

  const beforeWidth = getStringWidth(lines[line - 1].slice(0, column));
  const markerWidth = getStringWidth(lines[line - 1].slice(column, lastColumn));
  output += " ".repeat(beforeWidth) + "^".repeat(markerWidth);

  if (after.length) {
    output += `\n${highlight(after.join("\n"))}`;
  }

  return output;
}

declare module "readline" {
  interface Interface {
    _getDisplayPos(str: string): { rows: number; cols: number };
  }
}

function getStringWidth(ch: string) {
  // YOLO
  return readline.Interface.prototype._getDisplayPos.call(
    {
      columns: Infinity,
      tabSize: 8,
    },
    ch,
  ).cols;
}

export const __tests__ = { formatContext };
