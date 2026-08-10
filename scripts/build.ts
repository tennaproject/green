import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const output = join(root, "dist");
const staticFiles = ["index.html", "script.js", "sign-renderer.js", "style.css"];

await rm(output, { force: true, recursive: true });
await mkdir(output, { recursive: true });

await Promise.all([
  ...staticFiles.map((file) => cp(join(root, file), join(output, file))),
  cp(join(root, "assets"), join(output, "assets"), {
    filter: (source: string) => !source.endsWith("/.DS_Store"),
    recursive: true,
  }),
]);

console.log(`Built ${output}`);
