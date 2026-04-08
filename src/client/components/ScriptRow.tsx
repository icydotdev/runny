import React, { useState } from "react";
import { Play, Square, ChevronRight, Star } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useScriptRunner } from "../hooks/useScriptRunner";
import { useStore } from "../store/scripts";

interface ScriptRowProps {
  packageName: string;
  scriptName: string;
  command: string;
  indent?: boolean;
  showPackageName?: boolean;
}

export function ScriptRow({ packageName, scriptName, command, indent, showPackageName }: ScriptRowProps) {
  const [showCommand, setShowCommand] = useState(false);
  const { run, stop } = useScriptRunner();
  const id = `${packageName}:${scriptName}`;
  const scriptState = useStore((s) => s.scriptStates.get(id));
  const selectedScriptId = useStore((s) => s.selectedScriptId);
  const selectScript = useStore((s) => s.selectScript);
  const isFavourite = useStore((s) => s.favourites.has(id));
  const toggleFavourite = useStore((s) => s.toggleFavourite);

  const status = scriptState?.status ?? "idle";
  const isRunning = status === "running";
  const isSelected = selectedScriptId === id;

  return (
    <div
      style={{
        borderLeft: isSelected
          ? "2px solid var(--color-text, #6366f1)"
          : "2px solid transparent",
        background: isSelected ? "rgba(99,102,241,0.05)" : undefined,
      }}
      className="group"
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "var(--color-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        className={`flex items-center gap-2 py-1.5 cursor-pointer ${indent ? "pl-6 pr-3" : "px-3"}`}
        onClick={() => selectScript(id)}
      >
        <StatusBadge status={status} />
        <span
          className={`flex-1 truncate ${indent ? "text-xs" : "text-sm"}`}
          style={{ color: indent ? "var(--color-muted)" : "var(--color-text-secondary)" }}
        >
          {showPackageName && (
            <span className="text-xs" style={{ color: "var(--color-muted)" }}>
              {packageName}{" "}
            </span>
          )}
          {scriptName}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavourite(id);
          }}
          className={`p-0.5 transition-opacity ${isFavourite ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          title={isFavourite ? "Remove from favourites" : "Add to favourites"}
        >
          <Star
            size={12}
            className={isFavourite ? "fill-runny-yellow text-runny-yellow" : ""}
            style={isFavourite ? undefined : { color: "var(--color-muted)" }}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowCommand(!showCommand);
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
          style={{ color: "var(--color-muted)" }}
          title="Show command"
        >
          <ChevronRight
            size={12}
            className={`transition-transform ${showCommand ? "rotate-90" : ""}`}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isRunning) {
              stop(packageName, scriptName);
            } else {
              run(packageName, scriptName);
            }
          }}
          className={`p-1 rounded transition-colors ${
            isRunning
              ? "text-runny-red hover:bg-runny-red/10"
              : "text-runny-green hover:bg-runny-green/10"
          }`}
          title={isRunning ? "Stop" : "Run"}
        >
          {isRunning ? <Square size={12} /> : <Play size={12} />}
        </button>
      </div>
      {showCommand && (
        <div className="px-3 pb-1.5 pl-7">
          <code className="text-xs break-all" style={{ color: "var(--color-muted)" }}>
            {command}
          </code>
        </div>
      )}
    </div>
  );
}
