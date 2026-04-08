import React from "react";
import { Star } from "lucide-react";
import { ScriptRow } from "./ScriptRow";
import { useStore } from "../store/scripts";

export function Favourites() {
  const favourites = useStore((s) => s.favourites);
  const packages = useStore((s) => s.packages);

  if (favourites.size === 0) return null;

  // Resolve favourite IDs to their package + script info
  const items: Array<{
    packageName: string;
    scriptName: string;
    command: string;
  }> = [];

  for (const id of favourites) {
    const colonIdx = id.lastIndexOf(":");
    if (colonIdx === -1) continue;

    // IDs are "packageName:scriptName" but packageName can contain colons (e.g. @scope/name)
    // We need to find the right split. Try matching against known packages.
    for (const pkg of packages) {
      const prefix = `${pkg.name}:`;
      if (id.startsWith(prefix)) {
        const scriptName = id.slice(prefix.length);
        if (pkg.scripts[scriptName]) {
          items.push({
            packageName: pkg.name,
            scriptName,
            command: pkg.scripts[scriptName],
          });
          break;
        }
      }
    }
  }

  if (items.length === 0) return null;

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div className="flex items-center gap-1.5 px-3 py-2">
        <Star size={12} className="fill-runny-yellow text-runny-yellow" />
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--color-muted)" }}
        >
          Favourites
        </span>
      </div>
      <div className="pb-1">
        {items.map((item) => (
          <ScriptRow
            key={`${item.packageName}:${item.scriptName}`}
            packageName={item.packageName}
            scriptName={item.scriptName}
            command={item.command}
            showPackageName
          />
        ))}
      </div>
    </div>
  );
}
