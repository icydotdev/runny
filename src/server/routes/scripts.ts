import { Router } from "express";
import { processManager } from "../services/process-manager.js";
import type { AppConfig, PackageInfo } from "../types.js";

export function createScriptsRouter(packages: PackageInfo[], config: AppConfig): Router {
  const router = Router();

  router.post("/api/scripts/run", (req, res) => {
    const { packageName, scriptName } = req.body as {
      packageName: string;
      scriptName: string;
    };

    const pkg = packages.find((p) => p.name === packageName);
    if (!pkg) {
      res.status(404).json({ error: `Package "${packageName}" not found` });
      return;
    }

    if (!pkg.scripts[scriptName]) {
      res.status(404).json({
        error: `Script "${scriptName}" not found in ${packageName}`,
      });
      return;
    }

    const managed = processManager.run(packageName, pkg.path, scriptName);
    res.json(managed);
  });

  router.post("/api/scripts/stop", (req, res) => {
    const { id } = req.body as { id: string };

    const stopped = processManager.stop(id);
    if (!stopped) {
      res.status(404).json({ error: `Process "${id}" not found or not running` });
      return;
    }

    res.json({ ok: true });
  });

  router.get("/api/scripts/status", (_req, res) => {
    res.json(processManager.getAllStatuses());
  });

  router.post("/api/install", (_req, res) => {
    const command = `${config.packageManager} install`;
    const managed = processManager.runRaw(
      "__runny:install",
      config.rootPath,
      command
    );
    res.json(managed);
  });

  return router;
}
