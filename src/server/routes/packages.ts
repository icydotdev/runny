import { Router } from "express";
import type { PackageInfo } from "../types.js";

export function createPackagesRouter(packages: PackageInfo[]): Router {
  const router = Router();

  router.get("/api/packages", (_req, res) => {
    res.json(packages);
  });

  return router;
}
