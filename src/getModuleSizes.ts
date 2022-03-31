import { SourceMapConsumer, RawSourceMap, MappingItem } from "source-map";

export interface ModuleSizeEntry {
  source: string | null;
  size: number;
}
export async function getModuleSizes(
  sourceContent: string,
  sourceMap: RawSourceMap | string,
  consolidateNull: boolean = false
): Promise<ModuleSizeEntry[]> {
  return SourceMapConsumer.with(sourceMap, null, (consumer) => {
    const lineIndexes = computeLineIndexes(sourceContent);
    const modules = new Map<string | null, number>();

    let lastEnd = 0;
    function addSize(mapping: MappingItem | undefined, end: number) {
      let source = mapping ? mapping.source : null;
      if (source === null && consolidateNull) {
        return;
      }
      const totalSizeForModule = modules.get(source) ?? 0;
      modules.set(source, totalSizeForModule + end - lastEnd);
      lastEnd = end;
    }

    let previousMapping: MappingItem | undefined;
    consumer.eachMapping((mapping) => {
      const currentMappingStart = getIndex(lineIndexes, {
        line: mapping.generatedLine,
        column: mapping.generatedColumn,
      });

      addSize(previousMapping, currentMappingStart);
      previousMapping = mapping;
    });

    addSize(previousMapping, sourceContent.length);

    return Array.from(modules.entries(), ([source, size]) => ({
      source,
      size,
    }));
  });
}

interface Position {
  line: number;
  column: number;
}

export function computeLineIndexes(sourceContent: string): number[] {
  const lineIndexes = [];
  let re = /\n/g;
  while (true) {
    const match = re.exec(sourceContent);
    if (!match) break;
    lineIndexes.push(re.lastIndex);
  }
  lineIndexes.push(sourceContent.length);
  return lineIndexes;
}

export function getIndex(lineIndexes: number[], position: Position) {
  if (position.line < 1) {
    throw new Error("Cannot get index: line cannot be less than 1");
  }
  if (position.line > lineIndexes.length) {
    throw new Error("Cannot get index: line greater than line count");
  }
  if (position.column < 0) {
    throw new Error("Cannot get index: column cannot be negative");
  }
  if (position.column >= lineIndexes[position.line - 1]) {
    throw new Error("Cannot get index: column greater than column count");
  }
  let lineIndex = position.line === 1 ? 0 : lineIndexes[position.line - 2];
  return lineIndex + position.column;
}
