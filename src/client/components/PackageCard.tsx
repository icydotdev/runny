import React from "react";
import { ChevronDown, Package } from "lucide-react";
import { ScriptRow } from "./ScriptRow";
import { useStore } from "../store/scripts";
import { groupScripts } from "../lib/group-scripts";
import type { PackageInfo } from "../lib/api";

interface PackageCardProps {
  pkg: PackageInfo;
}

export function PackageCard({ pkg }: PackageCardProps) {
  const searchQuery = useStore((s) => s.searchQuery);
  const isCollapsed = useStore((s) => s.sidebarCollapsed.get(pkg.name));
  const toggleCollapsed = useStore((s) => s.togglePackageCollapsed);
  const scriptStates = useStore((s) => s.scriptStates);

  const groupingEnabled = useStore((s) => s.groupingEnabled);

  const scripts = Object.entries(pkg.scripts);
  const filteredScripts = searchQuery
    ? scripts.filter(([name]) =>
        name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : scripts;

  if (filteredScripts.length === 0) return null;

  const groups = groupingEnabled
    ? groupScripts(filteredScripts)
    : filteredScripts.map(([name, command]) => ({
        prefix: null as string | null,
        scripts: [[name, command]] as Array<[string, string]>,
      }));

  const runningCount = scripts.filter(([name]) => {
    const id = `${pkg.name}:${name}`;
    return scriptStates.get(id)?.status === "running";
  }).length;

  return (
    <div style={{ borderBottom: "1px solid var(--color-border)" }}>
      <button
        onClick={() => toggleCollapsed(pkg.name)}
        className="w-full flex items-center gap-2 px-3 py-2 transition-colors"
        style={{ color: "var(--color-text)" }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "var(--color-hover)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "transparent")
        }
      >
        <ChevronDown
          size={14}
          className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
          style={{ color: "var(--color-muted)" }}
        />
        <Package size={14} style={{ color: "var(--color-muted)" }} />
        <span className="text-sm font-medium flex-1 text-left truncate">
          {pkg.name}
        </span>
        {runningCount > 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full bg-runny-green/20 text-runny-green">
            {runningCount}
          </span>
        )}
        <span className="text-xs" style={{ color: "var(--color-muted)" }}>
          {filteredScripts.length}
        </span>
      </button>
      {!isCollapsed && (
        <div className="pb-1">
          {groups.map((group, i) => (
            <div key={group.prefix ?? group.scripts[0][0]}>
              {i > 0 && (
                <div
                  className="mx-3 my-1"
                  style={{ borderTop: "1px solid var(--color-border)", opacity: 0.5 }}
                />
              )}
              {group.scripts.map(([name, command]) => {
                const isVariant =
                  group.prefix !== null && name !== group.prefix;
                return (
                  <ScriptRow
                    key={name}
                    packageName={pkg.name}
                    scriptName={name}
                    command={command}
                    indent={isVariant}
                  />
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
