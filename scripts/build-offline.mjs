import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative } from "node:path";

const root = resolve("dist");
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...(await files(path)));
    else result.push(path);
  }
  return result;
}
const assets = (await files(root))
  .filter((path) => !["sw.js", "_headers"].includes(relative(root, path)))
  .sort();
const hash = createHash("sha256");
for (const path of assets) {
  hash.update(relative(root, path));
  hash.update(await readFile(path));
}
const version = hash.digest("hex").slice(0, 16);
const urls = assets.map((path) => "/" + relative(root, path));
const template = await readFile("scripts/sw-template.js", "utf8");
await writeFile(
  resolve(root, "sw.js"),
  template
    .replace("__VERSION__", version)
    .replace("__ASSETS__", JSON.stringify(urls)),
);
console.log(`Offline package: ${assets.length} resources, version ${version}`);
