import React from "react";
import { Moon, Sun } from "lucide-react";
import { useStore } from "../store/scripts";
import { useThemeStore } from "../hooks/useTheme";
import logoSvg from "../assets/logo.svg";

export function Header() {
  const config = useStore((s) => s.config);
  const theme = useThemeStore((s) => s.theme);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <header
      className="h-14 flex items-center justify-between px-5 shrink-0"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <img src={logoSvg} alt="Runny" className="w-7 h-7" />
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-runny-accent">runny</span>
        </h1>
        {config && (
          <>
            <span style={{ color: "var(--color-muted)" }}>/</span>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {config.repoName}
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {config && (
          <span
            className="text-xs px-2 py-1 rounded"
            style={{
              background: "var(--color-border)",
              color: "var(--color-muted)",
            }}
          >
            {config.packageManager}
          </span>
        )}
        <button
          onClick={toggle}
          className="p-1.5 rounded-md transition-colors hover:bg-runny-accent/10"
          style={{ color: "var(--color-muted)" }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
