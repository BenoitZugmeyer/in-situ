import type { GridLocation, Location } from "./types";

export default function resolveGridLocation(
  location: Location,
  content: string,
): GridLocation {
  if ("line" in location) {
    return location;
  }

  let line = 1;
  let column = location.position + 1;

  for (const match of content.matchAll(/\r\n|\r|\n/g)) {
    if (location.position < match.index) {
      break;
    }

    const endOfLinePosition = match.index + match[0].length;
    if (location.position < endOfLinePosition) {
      throw new Error("Invalid location at line break");
    }

    column = location.position - endOfLinePosition + 1;
    line += 1;
  }

  return { line, column };
}
