import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { detectPackageManager } from "./services/detector.js";
import { discoverPackages } from "./services/discovery.js";
import { processManager } from "./services/process-manager.js";
import { createConfigRouter } from "./routes/config.js";
import { createPackagesRouter } from "./routes/packages.js";
import { createScriptsRouter } from "./routes/scripts.js";
import { setupWebSocket } from "./ws/log-stream.js";
import type { AppConfig } from "./types.js";
import net from "net";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => resolve(startPort));
    });
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

export async function startServer(targetDir: string, preferredPort: number) {
  const port = await findAvailablePort(preferredPort);
  const pm = detectPackageManager(targetDir);
  processManager.setPackageManager(pm);

  const packages = await discoverPackages(targetDir, pm);
  const repoName = path.basename(targetDir);

  const config: AppConfig = {
    repoName,
    rootPath: targetDir,
    packageManager: pm,
  };

  const app = express();
  app.use(express.json());

  // API routes
  app.use(createConfigRouter(config));
  app.use(createPackagesRouter(packages));
  app.use(createScriptsRouter(packages, config));

  // Serve static frontend
  const clientDir = path.join(__dirname, "..", "client");
  app.use(express.static(clientDir));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });

  const server = createServer(app);
  setupWebSocket(server);

  server.listen(port, () => {
    console.log(`\n  🏃 Runny is running!\n`);
    console.log(`  Local:   http://localhost:${port}`);
    if (port !== preferredPort) {
      console.log(`  (port ${preferredPort} was in use, using ${port} instead)`);
    }
    console.log(`  Target:  ${targetDir}`);
    console.log(`  Manager: ${pm}`);
    console.log(`  Packages: ${packages.length}\n`);
  });

  // Cleanup on exit
  const cleanup = () => {
    processManager.killAll();
    server.close();
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  return { server, port };
}
