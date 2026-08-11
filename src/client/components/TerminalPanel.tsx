import React, { useEffect, useRef, useState } from "react";
import { Terminal as XTerminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Terminal } from "lucide-react";
import { useLogStream } from "../hooks/useLogStream";
import { useStore } from "../store/scripts";
import { SessionStrip } from "./SessionStrip";
import "@xterm/xterm/css/xterm.css";

const DARK_THEME = {
  background: "#0f1117",
  foreground: "#e5e7eb",
  cursor: "#6366f1",
  selectionBackground: "#6366f140",
};

const LIGHT_THEME = {
  background: "#fafbfc",
  foreground: "#1a1d27",
  cursor: "#6366f1",
  selectionBackground: "#6366f140",
};

export function TerminalPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  // State (not just ref) so useLogStream re-runs once xterm is ready.
  const [terminal, setTerminal] = useState<XTerminal | null>(null);
  const selectedScriptId = useStore((s) => s.selectedScriptId);
  const packages = useStore((s) => s.packages);
  const scriptState = useStore((s) =>
    s.selectedScriptId ? s.scriptStates.get(s.selectedScriptId) : undefined
  );
  const theme = useStore((s) => s.theme);

  const selectedLabel = (() => {
    if (!selectedScriptId) return null;
    if (packages.length <= 1) {
      const colon = selectedScriptId.lastIndexOf(":");
      return colon === -1 ? selectedScriptId : selectedScriptId.slice(colon + 1);
    }
    return selectedScriptId;
  })();

  // Initialize xterm
  useEffect(() => {
    if (!containerRef.current) return;

    const terminal = new XTerminal({
      theme: theme === "dark" ? DARK_THEME : LIGHT_THEME,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: false,
      disableStdin: true,
      convertEol: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    setTerminal(terminal);

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      terminal.dispose();
      terminalRef.current = null;
      setTerminal(null);
    };
  }, []);

  // Update xterm theme when app theme changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme =
        theme === "dark" ? DARK_THEME : LIGHT_THEME;
    }
  }, [theme]);

  useLogStream(terminal);

  const status = scriptState?.status;

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--color-bg)" }}>
      <SessionStrip />
      {/* Terminal header */}
      <div
        className="h-10 flex items-center px-4 gap-2 shrink-0"
        style={{
          background: "var(--color-surface)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <Terminal size={14} style={{ color: "var(--color-muted)" }} />
        {selectedScriptId ? (
          <>
            <span className="text-sm" style={{ color: "var(--color-text)" }}>
              {selectedLabel}
            </span>
            {status && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  status === "running"
                    ? "bg-runny-green/20 text-runny-green"
                    : status === "errored"
                      ? "bg-runny-red/20 text-runny-red"
                      : ""
                }`}
                style={
                  status !== "running" && status !== "errored"
                    ? { background: "var(--color-border)", color: "var(--color-muted)" }
                    : undefined
                }
              >
                {status}
                {scriptState?.exitCode !== null && status !== "running"
                  ? ` (${scriptState?.exitCode})`
                  : ""}
              </span>
            )}
          </>
        ) : (
          <span className="text-sm" style={{ color: "var(--color-muted)" }}>
            Select a script to view output
          </span>
        )}
      </div>

      {/* Terminal body */}
      <div className="flex-1 relative">
        {!selectedScriptId && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ color: "var(--color-muted)" }}
          >
            <div className="text-center">
              <Terminal size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Click a script to view its output</p>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className={`absolute inset-0 p-2 ${!selectedScriptId ? "opacity-0" : ""}`}
        />
      </div>
    </div>
  );
}
