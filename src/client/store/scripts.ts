import { create } from "zustand";
import type { PackageInfo, AppConfig, ManagedProcess } from "../lib/api";

export interface ScriptState {
  status: "idle" | "running" | "stopped" | "errored";
  exitCode: number | null;
}

interface Store {
  config: AppConfig | null;
  packages: PackageInfo[];
  scriptStates: Map<string, ScriptState>;
  selectedScriptId: string | null;
  searchQuery: string;
  sidebarCollapsed: Map<string, boolean>;
  groupingEnabled: boolean;
  favourites: Set<string>;

  setConfig: (config: AppConfig) => void;
  setPackages: (packages: PackageInfo[]) => void;
  setScriptStatus: (
    id: string,
    status: ScriptState["status"],
    exitCode?: number | null
  ) => void;
  selectScript: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  togglePackageCollapsed: (packageName: string) => void;
  setAllCollapsed: (collapsed: boolean) => void;
  toggleGrouping: () => void;
  toggleFavourite: (id: string) => void;
  initFromStatuses: (statuses: ManagedProcess[]) => void;
}

export const useStore = create<Store>((set) => ({
  config: null,
  packages: [],
  scriptStates: new Map(),
  selectedScriptId: null,
  searchQuery: "",
  sidebarCollapsed: new Map(),
  groupingEnabled: true,
  favourites: new Set<string>(),

  setConfig: (config) => set({ config }),

  setPackages: (packages) =>
    set(() => {
      const sidebarCollapsed = new Map<string, boolean>();
      if (packages.length > 1) {
        for (const pkg of packages) {
          sidebarCollapsed.set(pkg.name, true);
        }
      }
      return { packages, sidebarCollapsed };
    }),

  setScriptStatus: (id, status, exitCode = null) =>
    set((state) => {
      const next = new Map(state.scriptStates);
      next.set(id, { status, exitCode });
      return { scriptStates: next };
    }),

  selectScript: (id) => set({ selectedScriptId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  togglePackageCollapsed: (packageName) =>
    set((state) => {
      const next = new Map(state.sidebarCollapsed);
      next.set(packageName, !next.get(packageName));
      return { sidebarCollapsed: next };
    }),

  setAllCollapsed: (collapsed) =>
    set((state) => {
      const next = new Map<string, boolean>();
      for (const pkg of state.packages) {
        next.set(pkg.name, collapsed);
      }
      return { sidebarCollapsed: next };
    }),

  toggleGrouping: () =>
    set((state) => {
      const next = !state.groupingEnabled;
      localStorage.setItem("runny-grouping", String(next));
      return { groupingEnabled: next };
    }),

  toggleFavourite: (id) =>
    set((state) => {
      const next = new Set(state.favourites);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      localStorage.setItem("runny-favourites", JSON.stringify([...next]));
      return { favourites: next };
    }),

  initFromStatuses: (statuses) =>
    set(() => {
      const next = new Map<string, ScriptState>();
      for (const s of statuses) {
        next.set(s.id, { status: s.status, exitCode: s.exitCode });
      }
      return { scriptStates: next };
    }),
}));

// Restore preferences from localStorage
if (typeof window !== "undefined") {
  const storedGrouping = localStorage.getItem("runny-grouping");
  if (storedGrouping === "false") {
    useStore.setState({ groupingEnabled: false });
  }

  try {
    const storedFavs = localStorage.getItem("runny-favourites");
    if (storedFavs) {
      useStore.setState({ favourites: new Set(JSON.parse(storedFavs)) });
    }
  } catch {
    // ignore
  }
}
