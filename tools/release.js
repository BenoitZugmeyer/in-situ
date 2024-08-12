const { execSync: exec } = require("child_process");
const { readFileSync: read } = require("fs");

console.log("Verifying context...");

const tag = exec("git tag --points-at HEAD").toString().trim();
// Verify last commit tag
if (!tag) {
  error("No tag is pointing to HEAD");
}

const versionRe = /^v((\d+\.\d+\.\d+)(?:-(beta)\.\d+)?)$/;
const versionMatches = versionRe.exec(tag);
// Verify version syntax
if (!versionMatches) {
  error(`Tag '${tag}' doesn't look like a version`);
}

const [_, version, stableVersion, channel = "latest"] = versionMatches;

// Verify last commit message
const message = exec('git log -1 --pretty="format:%s\n%b"').toString().trim();
if (message !== version) {
  error(`Commit message should be '${version}'`);
}

// Verify repository status
if (exec("git status --porcelain").length) {
  error("Repository should be clean");
}

const firstChangelogLine = read("CHANGELOG.md").toString().match(/^.+$/m)[0];
const date =
  channel !== "latest" ? "UNRELEASED" : new Date().toISOString().slice(0, 10);
const expectedFirstChangelogLine = `${date} v${stableVersion}`;
if (!firstChangelogLine.startsWith(expectedFirstChangelogLine)) {
  error(`CHANGELOG.md should start with '${expectedFirstChangelogLine}'`);
}

console.log("\nRunning tests...");
exec("npm --silent test", { stdio: "inherit" });
console.log("\nRunning lint...");
exec("npm run --silent lint", { stdio: "inherit" });

console.log("\nPacking...");
const packed = exec("npm pack 2>&1").toString().split("\n");

const STATE_INIT = 0;
const STATE_TARBALL_CONTENTS = 1;
const STATE_TARBALL_DETAILS = 2;
const STATE_TARBALL_FILENAME = 3;

let state = STATE_INIT;
const content = new Set();
let tarballFileName;

for (let line of packed) {
  line = line.replace(/^npm notice /, "").trim();
  switch (state) {
    case STATE_INIT:
      if (line === "=== Tarball Contents ===") {
        state = STATE_TARBALL_CONTENTS;
      }
      break;
    case STATE_TARBALL_CONTENTS:
      if (line === "=== Tarball Details ===") {
        state = STATE_TARBALL_DETAILS;
      } else {
        content.add(line.match(/.*?\s+(.*)$/)[1]);
      }
      break;
    case STATE_TARBALL_DETAILS:
      if (!line) {
        state = STATE_TARBALL_FILENAME;
      }
      break;
    case STATE_TARBALL_FILENAME:
      if (line) {
        tarballFileName = line;
      }
      break;
  }
}

const expectedContent = new Set([
  "main.js",
  "package.json",
  "CHANGELOG.md",
  "LICENSE.md",
  "README.md",
]);

for (const file of expectedContent) {
  if (!content.has(file)) error(`Missing ${file} in package content`);
}
for (const file of content) {
  if (!expectedContent.has(file))
    error(`Unexpected ${file} in package content`);
}

console.log("OK");
console.log(`\nPublishing to channel ${channel}:`);

exec(`npm publish ${tarballFileName} --tag ${channel}`, {
  stdio: "inherit",
});

function error(message) {
  console.error(message);
  process.exit(1);
}
