import * as plotly from "plotly.js-dist-min";

const data = window.MODULE_SIZES;
interface ModuleSizeEntry {
  source: string;
  size: number;
}

declare global {
  interface Window {
    MODULE_SIZES: ModuleSizeEntry[];
  }
}

const entries = new Map();

for (const moduleSize of window.MODULE_SIZES) {
  const chunks = moduleSize.source.split("/");
  let parentId = "";
  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i];
    if (!chunk) {
      continue;
    }
    const path = chunks.slice(0, i + 1).join("/");
    if (!entries.has(path)) {
      entries.set(path, {
        label: chunk,
        id: path,
        parent: parentId,
        value: moduleSize.size,
      });
    } else {
      entries.get(path).value += moduleSize.size;
    }
    parentId = path;
  }
}

document.querySelector("body").style.margin = "0";
document.querySelector("#app").style.height = "100vh";
plotly.newPlot(
  document.querySelector("#app"),
  [
    {
      type: "treemap",
      branchvalues: "total",
      labels: Array.from(entries.values(), (e) => e.label),
      parents: Array.from(entries.values(), (e) => e.parent),
      values: Array.from(entries.values(), (e) => e.value),
      ids: Array.from(entries.values(), (e) => e.id),
      text: Array.from(entries.values(), (e) => formatHumanReadable(e.value)),
      textinfo: "label+text",
      hoverinfo: "label+text",
    },
  ],
  {
    // autosize: true,
    margin: {
      pad: 0,
      t: 30,
      l: 10,
      r: 10,
      b: 10,
    },
  },
  { responsive: true }
);

let numberFormat;
function formatHumanReadable(n: number): string {
  if (!numberFormat) {
    numberFormat = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 0,
    });
  }
  return numberFormat.format(n);
}
