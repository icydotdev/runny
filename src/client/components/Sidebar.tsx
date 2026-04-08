import React from "react";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { Favourites } from "./Favourites";
import { PackageCard } from "./PackageCard";
import { useStore } from "../store/scripts";

export function Sidebar() {
  const packages = useStore((s) => s.packages);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);
  const setAllCollapsed = useStore((s) => s.setAllCollapsed);
  const groupingEnabled = useStore((s) => s.groupingEnabled);
  const toggleGrouping = useStore((s) => s.toggleGrouping);

  const allCollapsed =
    packages.length > 0 && packages.every((p) => sidebarCollapsed.get(p.name));

  return (
    <aside
      className="w-80 flex flex-col shrink-0 overflow-hidden"
      style={{
        background: "var(--color-surface)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      <SearchBar />
      {packages.length > 1 && (
        <div
          className="flex items-center justify-between px-3 pb-2"
        >
          <label
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={groupingEnabled}
              onChange={toggleGrouping}
              className="rounded accent-runny-accent w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              Group related scripts
            </span>
          </label>
          <button
            onClick={() => setAllCollapsed(!allCollapsed)}
            className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-colors hover:bg-runny-accent/10"
            style={{ color: "var(--color-muted)" }}
            title={allCollapsed ? "Expand all" : "Collapse all"}
          >
            {allCollapsed ? (
              <>
                <ChevronsUpDown size={12} />
                Expand all
              </>
            ) : (
              <>
                <ChevronsDownUp size={12} />
                Collapse all
              </>
            )}
          </button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        <Favourites />
        {packages.length === 0 ? (
          <div
            className="px-3 py-8 text-center text-sm"
            style={{ color: "var(--color-muted)" }}
          >
            No packages found
          </div>
        ) : (
          packages.map((pkg) => <PackageCard key={pkg.name} pkg={pkg} />)
        )}
      </div>
      <div
        className="px-3 py-2 text-xs"
        style={{
          borderTop: "1px solid var(--color-border)",
          color: "var(--color-muted)",
        }}
      >
        {packages.length} package{packages.length !== 1 ? "s" : ""}
      </div>
    </aside>
  );
}
