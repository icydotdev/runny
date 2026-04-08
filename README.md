<p align="center">
  <img src="https://raw.githubusercontent.com/icydotdev/runny/main/assets/logo.svg" width="120" alt="Runny" />
</p>

<h1 align="center">Runny</h1>

<p align="center">
  <strong>A visual dashboard for all your npm scripts. Zero config.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@icydotdev/runny"><img src="https://img.shields.io/npm/v/@icydotdev/runny.svg?style=flat&colorA=18181B&colorB=6366f1" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/@icydotdev/runny"><img src="https://img.shields.io/npm/dm/@icydotdev/runny.svg?style=flat&colorA=18181B&colorB=6366f1" alt="npm downloads" /></a>
  <a href="https://github.com/icydotdev/runny/blob/main/LICENSE"><img src="https://img.shields.io/github/license/icydotdev/runny?style=flat&colorA=18181B&colorB=6366f1" alt="license" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> · <a href="#features">Features</a> · <a href="#screenshots">Screenshots</a> · <a href="#usage">Usage</a> · <a href="#contributing">Contributing</a>
</p>

---

Stop memorising script names. Stop tabbing between terminals. **Runny** scans your project for every `package.json`, lays out all your scripts in a clean GUI, and lets you run, stop, and monitor them — all from your browser.

Works with **npm**, **pnpm**, and **yarn** workspaces. Monorepos with 50 packages or solo projects with 3 scripts — same experience.

<!-- TODO: Replace with actual GIF/screenshot -->
<p align="center">
  <img src="https://raw.githubusercontent.com/icydotdev/runny/main/assets/screenshot-dark.png" width="800" alt="Runny dashboard" />
</p>

## Quick Start

```bash
npx @icydotdev/runny
```

That's it. Opens your browser. Every script is right there.

Or install globally:

```bash
npm i -g @icydotdev/runny
cd your-project
runny
```

## Features

- **Instant discovery** — Automatically finds every `package.json` in your project, including all workspace packages
- **One-click run/stop** — Play and stop buttons for each script, with proper process tree cleanup (no orphan processes)
- **Live terminal output** — Real-time stdout/stderr streaming via WebSocket, rendered with full ANSI color support
- **Smart script grouping** — Scripts with shared prefixes (`test`, `test:ci`, `test:dev`) are visually grouped together
- **Favourites** — Star your most-used scripts for quick access across all packages
- **Dark & light mode** — Respects your system preference, with a manual toggle
- **Auto-detects your package manager** — pnpm, yarn, or npm — no configuration needed
- **Monorepo-native** — Built for workspaces. Tested against real monorepos with 20+ packages
- **Expand/collapse all** — Manage large package lists with one click
- **Zero config, zero dependencies on your project** — `npx` it and go

## Screenshots

<!-- TODO: Add actual screenshots after first release -->

<details>
<summary>Dark mode</summary>
<p align="center">
  <img src="https://raw.githubusercontent.com/icydotdev/runny/main/assets/screenshot-dark.png" width="800" alt="Dark mode" />
</p>
</details>

<details>
<summary>Light mode</summary>
<p align="center">
  <img src="https://raw.githubusercontent.com/icydotdev/runny/main/assets/screenshot-light.png" width="800" alt="Light mode" />
</p>
</details>

<details>
<summary>Script grouping</summary>
<p align="center">
  <img src="https://raw.githubusercontent.com/icydotdev/runny/main/assets/screenshot-grouping.png" width="400" alt="Script grouping" />
</p>
</details>

<details>
<summary>Favourites</summary>
<p align="center">
  <img src="https://raw.githubusercontent.com/icydotdev/runny/main/assets/screenshot-favourites.png" width="400" alt="Favourites" />
</p>
</details>

## Usage

```bash
# Run in current directory
runny

# Custom port
runny --port 4000

# Don't open browser automatically
runny --no-browser

# Via npx (no install)
npx @icydotdev/runny
```

### Supported project types

| Type | How it works |
|------|-------------|
| **Single package** | Reads `package.json` scripts, shows them flat (no collapsing) |
| **npm workspaces** | Reads `workspaces` field from root `package.json` |
| **yarn workspaces** | Reads `workspaces` field from root `package.json` |
| **pnpm workspaces** | Reads `pnpm-workspace.yaml` |

### How it works

1. Runny starts a lightweight local server (Express + WebSocket)
2. It scans your project for `package.json` files based on your workspace config
3. A React frontend opens in your browser showing all discovered scripts
4. When you click **Play**, Runny spawns the script as a child process using your package manager
5. stdout/stderr streams to the browser terminal in real time via WebSocket
6. When you click **Stop**, the entire process tree is killed cleanly — no orphaned processes

Your code is never uploaded anywhere. Everything runs locally on your machine.

## FAQ

<details>
<summary><strong>Does this upload my code / phone home?</strong></summary>

No. Runny is a local-only tool. The server runs on `localhost`, the frontend is bundled static assets served from your machine. There are zero network requests to external services.
</details>

<details>
<summary><strong>Can I use this in CI?</strong></summary>

Runny is designed as a local development tool, not for CI. Use your package manager's built-in script runners for CI.
</details>

<details>
<summary><strong>What about long-running scripts like `dev`?</strong></summary>

That's Runny's sweet spot. Start your dev servers, watch processes, and build watchers — see all their output in one place, stop them cleanly with one click.
</details>

<details>
<summary><strong>Will stopping a script leave zombie processes?</strong></summary>

No. Runny uses <a href="https://www.npmjs.com/package/tree-kill">tree-kill</a> to kill entire process trees. When you stop `pnpm run dev`, it kills pnpm, node, and any child processes spawned by your dev server.
</details>

<details>
<summary><strong>Does it work with Turborepo / Nx / Lerna?</strong></summary>

Yes — Runny reads workspace configuration (pnpm-workspace.yaml or the workspaces field in package.json), not your build orchestrator. Your Turbo/Nx scripts appear like any other script and can be run from Runny.
</details>

## Roadmap

- [ ] Multi-terminal — view multiple script outputs simultaneously
- [ ] Keyboard shortcuts (`Ctrl+K` search, arrow navigation, `Enter` to run)
- [ ] Desktop notifications when scripts finish or error
- [ ] "Run all" — start a common script across all packages at once
- [ ] Detect externally-running scripts started outside Runny
- [ ] Environment variable overrides per script

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a PR.

```bash
git clone https://github.com/icydotdev/runny.git
cd runny
npm install
npm run dev
```

This starts the Vite dev server (frontend) and the Express backend concurrently. Set `TARGET_DIR` to point at a project to test against:

```bash
TARGET_DIR=~/your-monorepo npm run dev
```

## License

MIT © [Sam Kavanagh](https://icy.dev)
