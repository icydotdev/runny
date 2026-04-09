const BASE = "";

export interface PackageInfo {
  name: string;
  path: string;
  relativePath: string;
  scripts: Record<string, string>;
  isRoot: boolean;
}

export interface AppConfig {
  repoName: string;
  rootPath: string;
  packageManager: string;
}

export interface ManagedProcess {
  id: string;
  packageName: string;
  packagePath: string;
  scriptName: string;
  command: string;
  pid: number | undefined;
  status: "running" | "stopped" | "errored";
  exitCode: number | null;
  startedAt: number;
}

export async function fetchConfig(): Promise<AppConfig> {
  const res = await fetch(`${BASE}/api/config`);
  return res.json();
}

export async function fetchPackages(): Promise<PackageInfo[]> {
  const res = await fetch(`${BASE}/api/packages`);
  return res.json();
}

export async function fetchStatuses(): Promise<ManagedProcess[]> {
  const res = await fetch(`${BASE}/api/scripts/status`);
  return res.json();
}

export async function runScript(
  packageName: string,
  scriptName: string
): Promise<ManagedProcess> {
  const res = await fetch(`${BASE}/api/scripts/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packageName, scriptName }),
  });
  return res.json();
}

export async function stopScript(id: string): Promise<void> {
  await fetch(`${BASE}/api/scripts/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export async function runInstall(): Promise<ManagedProcess> {
  const res = await fetch(`${BASE}/api/install`, { method: "POST" });
  return res.json();
}
