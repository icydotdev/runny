#!/usr/bin/env node

import path from "path";
import fs from "fs";
import open from "open";
import { startServer } from "./server/index.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`
  Usage: runny [options]

  Options:
    --port <number>   Port to run on (default: 3717)
    --no-browser      Don't open the browser automatically
    -h, --help        Show this help message
`);
  process.exit(0);
}

const portIndex = args.indexOf("--port");
const port =
  portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : 3717;
const noBrowser = args.includes("--no-browser");
const targetDir = process.env.TARGET_DIR || process.cwd();

// Verify package.json exists
if (!fs.existsSync(path.join(targetDir, "package.json"))) {
  console.error(
    `\n  Error: No package.json found in ${targetDir}\n  Run this command from a project directory.\n`
  );
  process.exit(1);
}

startServer(targetDir, port).then(() => {
  if (!noBrowser) {
    open(`http://localhost:${port}`);
  }
});
