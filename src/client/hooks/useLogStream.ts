import { useEffect, useRef } from "react";
import type { Terminal } from "@xterm/xterm";
import { wsManager } from "../lib/ws";
import { useStore } from "../store/scripts";

export function useLogStream(terminal: Terminal | null) {
  const selectedScriptId = useStore((s) => s.selectedScriptId);
  const setScriptStatus = useStore((s) => s.setScriptStatus);
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    wsManager.connect();
    return () => wsManager.disconnect();
  }, []);

  // Handle all incoming WebSocket messages for status updates
  useEffect(() => {
    const cleanup = wsManager.onMessage((data: unknown) => {
      const msg = data as {
        type: string;
        id?: string;
        status?: string;
        exitCode?: number | null;
      };
      if (msg.type === "status" && msg.id) {
        setScriptStatus(
          msg.id,
          msg.status as "running" | "stopped" | "errored",
          msg.exitCode
        );
      }
    });
    return cleanup;
  }, [setScriptStatus]);

  // Handle log subscription for the selected script
  useEffect(() => {
    if (!terminal) return;

    if (prevIdRef.current) {
      wsManager.unsubscribe();
    }

    if (!selectedScriptId) {
      prevIdRef.current = null;
      return;
    }

    terminal.clear();
    prevIdRef.current = selectedScriptId;
    wsManager.subscribe(selectedScriptId);

    const cleanup = wsManager.onMessage((data: unknown) => {
      const msg = data as {
        type: string;
        id?: string;
        stream?: string;
        data?: string;
        lines?: Array<{ stream: string; data: string }>;
      };

      if (msg.id !== selectedScriptId) return;

      if (msg.type === "history" && msg.lines) {
        for (const line of msg.lines) {
          const prefix =
            line.stream === "stderr" ? "\x1b[31m" : "";
          const suffix = line.stream === "stderr" ? "\x1b[0m" : "";
          terminal.writeln(`${prefix}${line.data}${suffix}`);
        }
      }

      if (msg.type === "log" && msg.data) {
        const prefix =
          msg.stream === "stderr" ? "\x1b[31m" : "";
        const suffix = msg.stream === "stderr" ? "\x1b[0m" : "";
        terminal.writeln(`${prefix}${msg.data}${suffix}`);
      }
    });

    return cleanup;
  }, [selectedScriptId, terminal]);
}
