import React, { useState } from "react";
import {
  Play,
  Square,
  ChevronRight,
  Star,
  GripVertical,
  Pencil,
  X,
  Copy,
  Check,
  Volume2,
  VolumeX,
} from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useScriptRunner } from "../hooks/useScriptRunner";
import { useStore } from "../store/scripts";
import {
  removePackageScript,
  updatePackageScript,
} from "../lib/api";

interface ScriptRowProps {
  packageName: string;
  scriptName: string;
  command: string;
  indent?: boolean;
  /** When true, shows a drag handle for favourites reordering. */
  draggable?: boolean;
  /** Allow editing a custom hover description (favourites). */
  editableDescription?: boolean;
  /** Favourite-group mute: skip this script when running the group. */
  muted?: boolean;
  onToggleMute?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function ScriptRow({
  packageName,
  scriptName,
  command,
  indent,
  draggable,
  editableDescription,
  muted,
  onToggleMute,
  onDragStart,
  onDragEnd,
}: ScriptRowProps) {
  const [showCommand, setShowCommand] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingScript, setEditingScript] = useState(false);
  const [nameDraft, setNameDraft] = useState(scriptName);
  const [commandDraft, setCommandDraft] = useState(command);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { run, stop } = useScriptRunner();
  const id = `${packageName}:${scriptName}`;
  const scriptState = useStore((s) => s.scriptStates.get(id));
  const selectedScriptId = useStore((s) => s.selectedScriptId);
  const selectScript = useStore((s) => s.selectScript);
  const refreshPackages = useStore((s) => s.refreshPackages);
  const packageManager = useStore((s) => s.config?.packageManager ?? "npm");
  const isFavourite = useStore((s) =>
    s.favouriteGroups.some((g) => g.scriptIds.includes(id))
  );
  const toggleFavourite = useStore((s) => s.toggleFavourite);
  const forgetScriptId = useStore((s) => s.forgetScriptId);
  const renameScriptId = useStore((s) => s.renameScriptId);
  const description = useStore((s) => s.scriptDescriptions[id]);
  const setScriptDescription = useStore((s) => s.setScriptDescription);
  const [descDraft, setDescDraft] = useState(description ?? "");

  const status = scriptState?.status ?? "idle";
  const isRunning = status === "running";
  const isSelected = selectedScriptId === id;
  const hoverText = description?.trim() || command;
  const editing = editingDesc || editingScript;

  const runCommand = `${packageManager} run ${scriptName}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(runCommand);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("Clipboard unavailable");
    }
  };

  const handleRemove = async () => {
    if (
      !window.confirm(
        `Remove "${scriptName}" from package.json?\n\nThis edits the file on disk.`
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const packages = await removePackageScript(packageName, scriptName);
      forgetScriptId(id);
      refreshPackages(packages);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveScript = async () => {
    const nextName = nameDraft.trim();
    const nextCommand = commandDraft;
    if (!nextName) {
      setError("Name required");
      return;
    }
    if (nextName === scriptName && nextCommand === command) {
      setEditingScript(false);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const packages = await updatePackageScript(packageName, scriptName, {
        name: nextName,
        command: nextCommand,
      });
      if (nextName !== scriptName) {
        renameScriptId(id, `${packageName}:${nextName}`);
      }
      refreshPackages(packages);
      setEditingScript(false);
      setShowCommand(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        borderLeft: isSelected
          ? "2px solid var(--color-text, #6366f1)"
          : "2px solid transparent",
        background: isSelected ? "rgba(99,102,241,0.05)" : undefined,
      }}
      className="group relative"
      draggable={draggable && !editing}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "var(--color-hover)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
      title={editing ? undefined : hoverText}
    >
      <div
        className={`flex items-center gap-2 py-1.5 cursor-pointer ${indent ? "pl-6 pr-3" : "px-3"}`}
        onClick={() => selectScript(id)}
      >
        {draggable && (
          <span
            className="opacity-0 group-hover:opacity-60 cursor-grab active:cursor-grabbing shrink-0"
            style={{ color: "var(--color-muted)" }}
            title="Drag to reorder"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical size={12} />
          </span>
        )}
        <StatusBadge status={status} />
        <span
          className={`flex-1 truncate ${indent ? "text-xs" : "text-sm"}`}
          style={{
            color: indent ? "var(--color-muted)" : "var(--color-text-secondary)",
            textDecoration: muted ? "line-through" : undefined,
          }}
        >
          {scriptName}
        </span>
        {onToggleMute && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className={`p-0.5 transition-opacity ${
              muted ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
            style={{ color: muted ? "#f59e0b" : "var(--color-muted)" }}
            title={
              muted
                ? "Unmute — include when running this group"
                : "Mute — skip when running this group"
            }
          >
            {muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>
        )}
        {editableDescription && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDescDraft(description ?? "");
              setEditingDesc(true);
              setEditingScript(false);
              setShowCommand(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
            style={{ color: "var(--color-muted)" }}
            title="Edit description"
          >
            <Pencil size={11} />
          </button>
        )}
        {!editableDescription && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setNameDraft(scriptName);
              setCommandDraft(command);
              setEditingScript(true);
              setEditingDesc(false);
              setShowCommand(true);
              setError(null);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
            style={{ color: "var(--color-muted)" }}
            title="Edit script in package.json"
            disabled={busy}
          >
            <Pencil size={11} />
          </button>
        )}
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
            void handleCopy();
          }}
          className={`p-0.5 transition-opacity ${copied ? "opacity-100 text-runny-green" : "opacity-0 group-hover:opacity-100"}`}
          style={copied ? undefined : { color: "var(--color-muted)" }}
          title={copied ? "Copied" : `Copy \`${runCommand}\``}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void handleRemove();
          }}
          className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity hover:text-runny-red"
          style={{ color: "var(--color-muted)" }}
          title="Remove from package.json"
          disabled={busy}
        >
          <X size={12} />
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
        <div className="px-3 pb-1.5 pl-7 space-y-1">
          {editableDescription && editingDesc ? (
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    setScriptDescription(id, descDraft);
                    setEditingDesc(false);
                  }
                  if (e.key === "Escape") setEditingDesc(false);
                }}
                placeholder="Description shown on hover…"
                className="flex-1 text-xs px-1.5 py-0.5 rounded outline-none"
                style={{
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
              />
              <button
                className="text-xs px-1.5 py-0.5 rounded hover:bg-runny-accent/10"
                style={{ color: "var(--color-text-secondary)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setScriptDescription(id, descDraft);
                  setEditingDesc(false);
                }}
              >
                Save
              </button>
            </div>
          ) : null}

          {editingScript ? (
            <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder="Script name"
                className="w-full text-xs px-1.5 py-0.5 rounded outline-none font-mono"
                style={{
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveScript();
                  if (e.key === "Escape") setEditingScript(false);
                }}
              />
              <input
                value={commandDraft}
                onChange={(e) => setCommandDraft(e.target.value)}
                placeholder="Command"
                className="w-full text-xs px-1.5 py-0.5 rounded outline-none font-mono"
                style={{
                  background: "var(--color-bg)",
                  color: "var(--color-text)",
                  border: "1px solid var(--color-border)",
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveScript();
                  if (e.key === "Escape") setEditingScript(false);
                }}
              />
              <div className="flex items-center gap-1">
                <button
                  className="text-xs px-1.5 py-0.5 rounded hover:bg-runny-accent/10"
                  style={{ color: "var(--color-text-secondary)" }}
                  disabled={busy}
                  onClick={() => void handleSaveScript()}
                >
                  Save to package.json
                </button>
                <button
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ color: "var(--color-muted)" }}
                  disabled={busy}
                  onClick={() => setEditingScript(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {description && !editingDesc && (
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {description}
                </p>
              )}
              <code
                className="text-xs break-all"
                style={{ color: "var(--color-muted)" }}
              >
                {command}
              </code>
            </>
          )}
          {error && (
            <p className="text-xs text-runny-red">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
