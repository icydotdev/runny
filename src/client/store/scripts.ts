import { create } from "zustand";
import type {
  PackageInfo,
  AppConfig,
  ManagedProcess,
  Session,
} from "../lib/api";
import { persistUserSettings } from "../lib/persist";
import type { UserConfig } from "../lib/user-config";

export interface ScriptState {
  status: "idle" | "running" | "stopped" | "errored";
  exitCode: number | null;
}

export interface FavouriteGroup {
  id: string;
  name: string;
  scriptIds: string[];
  /** Scripts kept in the group but skipped when running it. */
  mutedScriptIds?: string[];
}

const DEFAULT_GROUP_ID = "default";

function makeId(): string {
  return `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function persist(state: {
  theme: "light" | "dark";
  groupingEnabled: boolean;
  sidebarWidth: number;
  favouriteGroups: FavouriteGroup[];
  scriptDescriptions: Record<string, string>;
  expandedScriptGroups: string[];
  hiddenScripts: string[];
  userConfigReady: boolean;
}) {
  persistUserSettings({
    theme: state.theme,
    groupingEnabled: state.groupingEnabled,
    sidebarWidth: state.sidebarWidth,
    favouriteGroups: state.favouriteGroups,
    scriptDescriptions: state.scriptDescriptions,
    expandedScriptGroups: state.expandedScriptGroups,
    hiddenScripts: state.hiddenScripts,
    ready: state.userConfigReady,
  });
}

function defaultTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

interface Store {
  config: AppConfig | null;
  packages: PackageInfo[];
  scriptStates: Map<string, ScriptState>;
  /** Soft-CI sessions keyed by id (backend is source of truth). */
  sessions: Map<string, Session>;
  selectedScriptId: string | null;
  searchQuery: string;
  sidebarCollapsed: Map<string, boolean>;
  groupingEnabled: boolean;
  sidebarWidth: number;
  theme: "light" | "dark";
  favouriteGroups: FavouriteGroup[];
  scriptDescriptions: Record<string, string>;
  expandedScriptGroups: string[];
  hiddenScripts: string[];
  userConfigReady: boolean;

  setConfig: (config: AppConfig) => void;
  setPackages: (packages: PackageInfo[]) => void;
  /** Replace package list without resetting collapse state (after edit/delete). */
  refreshPackages: (packages: PackageInfo[]) => void;
  setScriptStatus: (
    id: string,
    status: ScriptState["status"],
    exitCode?: number | null
  ) => void;
  upsertSession: (session: Session) => void;
  setSessions: (sessions: Session[]) => void;
  selectScript: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  togglePackageCollapsed: (packageName: string) => void;
  setAllCollapsed: (collapsed: boolean) => void;
  toggleGrouping: () => void;
  setSidebarWidth: (width: number) => void;
  toggleTheme: () => void;
  setScriptGroupExpanded: (groupKey: string, expanded: boolean) => void;
  hideScript: (id: string) => void;
  unhideScript: (id: string) => void;
  clearHiddenScripts: () => void;
  applyUserConfig: (config: UserConfig) => void;
  isFavourite: (id: string) => boolean;
  toggleFavourite: (id: string) => void;
  addFavouriteGroup: (name?: string) => void;
  renameFavouriteGroup: (groupId: string, name: string) => void;
  removeFavouriteGroup: (groupId: string) => void;
  reorderFavouriteGroups: (fromIndex: number, toIndex: number) => void;
  moveFavouriteScript: (
    scriptId: string,
    toGroupId: string,
    toIndex: number
  ) => void;
  /** Mute/unmute a script within a favourite group (skipped on group run). */
  toggleFavouriteMute: (groupId: string, scriptId: string) => void;
  setScriptDescription: (id: string, description: string) => void;
  /** Drop a script id from favourites / descriptions after package.json delete. */
  forgetScriptId: (id: string) => void;
  /** Rewrite favourite + description keys after a script rename. */
  renameScriptId: (oldId: string, newId: string) => void;
  initFromStatuses: (statuses: ManagedProcess[]) => void;
}

export const useStore = create<Store>((set, get) => ({
  config: null,
  packages: [],
  scriptStates: new Map(),
  sessions: new Map(),
  selectedScriptId: null,
  searchQuery: "",
  sidebarCollapsed: new Map(),
  groupingEnabled: true,
  sidebarWidth: 320,
  theme: defaultTheme(),
  favouriteGroups: [
    { id: DEFAULT_GROUP_ID, name: "Favourites", scriptIds: [], mutedScriptIds: [] },
  ],
  scriptDescriptions: {},
  expandedScriptGroups: [],
  hiddenScripts: [],
  userConfigReady: false,

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

  refreshPackages: (packages) => set({ packages }),

  setScriptStatus: (id, status, exitCode = null) =>
    set((state) => {
      const next = new Map(state.scriptStates);
      next.set(id, { status, exitCode });
      return { scriptStates: next };
    }),

  upsertSession: (session) =>
    set((state) => {
      const next = new Map(state.sessions);
      next.set(session.id, session);
      return { sessions: next };
    }),

  setSessions: (sessions) =>
    set({
      sessions: new Map(sessions.map((s) => [s.id, s])),
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
      const groupingEnabled = !state.groupingEnabled;
      persist({ ...state, groupingEnabled });
      return { groupingEnabled };
    }),

  setSidebarWidth: (width) =>
    set((state) => {
      const sidebarWidth = Math.min(640, Math.max(220, Math.round(width)));
      persist({ ...state, sidebarWidth });
      return { sidebarWidth };
    }),

  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      persist({ ...state, theme });
      return { theme };
    }),

  setScriptGroupExpanded: (groupKey, expanded) =>
    set((state) => {
      const set = new Set(state.expandedScriptGroups);
      if (expanded) set.add(groupKey);
      else set.delete(groupKey);
      const expandedScriptGroups = [...set];
      persist({ ...state, expandedScriptGroups });
      return { expandedScriptGroups };
    }),

  hideScript: (id) =>
    set((state) => {
      if (state.hiddenScripts.includes(id)) return state;
      const hiddenScripts = [...state.hiddenScripts, id];
      // Also drop from favourites so it doesn't linger there.
      const favouriteGroups = state.favouriteGroups.map((g) => ({
        ...g,
        scriptIds: g.scriptIds.filter((s) => s !== id),
        mutedScriptIds: (g.mutedScriptIds ?? []).filter((s) => s !== id),
      }));
      const selectedScriptId =
        state.selectedScriptId === id ? null : state.selectedScriptId;
      persist({ ...state, hiddenScripts, favouriteGroups });
      return { hiddenScripts, favouriteGroups, selectedScriptId };
    }),

  unhideScript: (id) =>
    set((state) => {
      const hiddenScripts = state.hiddenScripts.filter((s) => s !== id);
      persist({ ...state, hiddenScripts });
      return { hiddenScripts };
    }),

  clearHiddenScripts: () =>
    set((state) => {
      const hiddenScripts: string[] = [];
      persist({ ...state, hiddenScripts });
      return { hiddenScripts };
    }),

  applyUserConfig: (config) =>
    set((state) => ({
      theme:
        config.theme === "light" || config.theme === "dark"
          ? config.theme
          : state.theme,
      groupingEnabled: config.groupingEnabled ?? true,
      sidebarWidth: config.sidebarWidth ?? 320,
      favouriteGroups:
        config.favouriteGroups && config.favouriteGroups.length > 0
          ? config.favouriteGroups.map((g) => ({
              ...g,
              mutedScriptIds: g.mutedScriptIds ?? [],
            }))
          : [
              {
                id: DEFAULT_GROUP_ID,
                name: "Favourites",
                scriptIds: [],
                mutedScriptIds: [],
              },
            ],
      scriptDescriptions: config.scriptDescriptions ?? {},
      expandedScriptGroups: config.expandedScriptGroups ?? [],
      hiddenScripts: config.hiddenScripts ?? [],
      userConfigReady: true,
    })),

  isFavourite: (id) =>
    get().favouriteGroups.some((g) => g.scriptIds.includes(id)),

  toggleFavourite: (id) =>
    set((state) => {
      const already = state.favouriteGroups.some((g) =>
        g.scriptIds.includes(id)
      );
      const favouriteGroups = already
        ? state.favouriteGroups.map((g) => ({
            ...g,
            scriptIds: g.scriptIds.filter((s) => s !== id),
            mutedScriptIds: (g.mutedScriptIds ?? []).filter((s) => s !== id),
          }))
        : state.favouriteGroups.length
          ? state.favouriteGroups.map((g, i) =>
              i === 0 ? { ...g, scriptIds: [...g.scriptIds, id] } : g
            )
          : [
              {
                id: DEFAULT_GROUP_ID,
                name: "Favourites",
                scriptIds: [id],
                mutedScriptIds: [],
              },
            ];
      persist({ ...state, favouriteGroups });
      return { favouriteGroups };
    }),

  addFavouriteGroup: (name = "New group") =>
    set((state) => {
      const favouriteGroups = [
        ...state.favouriteGroups,
        { id: makeId(), name, scriptIds: [], mutedScriptIds: [] },
      ];
      persist({ ...state, favouriteGroups });
      return { favouriteGroups };
    }),

  renameFavouriteGroup: (groupId, name) =>
    set((state) => {
      const trimmed = name.trim() || "Group";
      const favouriteGroups = state.favouriteGroups.map((g) =>
        g.id === groupId ? { ...g, name: trimmed } : g
      );
      persist({ ...state, favouriteGroups });
      return { favouriteGroups };
    }),

  removeFavouriteGroup: (groupId) =>
    set((state) => {
      if (state.favouriteGroups.length <= 1) return state;
      const removed = state.favouriteGroups.find((g) => g.id === groupId);
      const favouriteGroups = state.favouriteGroups.filter(
        (g) => g.id !== groupId
      );
      if (removed && removed.scriptIds.length > 0) {
        favouriteGroups[0] = {
          ...favouriteGroups[0],
          scriptIds: [...favouriteGroups[0].scriptIds, ...removed.scriptIds],
          mutedScriptIds: [
            ...(favouriteGroups[0].mutedScriptIds ?? []),
            ...(removed.mutedScriptIds ?? []).filter((id) =>
              removed.scriptIds.includes(id)
            ),
          ],
        };
      }
      persist({ ...state, favouriteGroups });
      return { favouriteGroups };
    }),

  reorderFavouriteGroups: (fromIndex, toIndex) =>
    set((state) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.favouriteGroups.length ||
        toIndex >= state.favouriteGroups.length
      ) {
        return state;
      }
      const favouriteGroups = [...state.favouriteGroups];
      const [moved] = favouriteGroups.splice(fromIndex, 1);
      favouriteGroups.splice(toIndex, 0, moved);
      persist({ ...state, favouriteGroups });
      return { favouriteGroups };
    }),

  moveFavouriteScript: (scriptId, toGroupId, toIndex) =>
    set((state) => {
      const favouriteGroups = state.favouriteGroups.map((g) => ({
        ...g,
        scriptIds: [...g.scriptIds],
        mutedScriptIds: [...(g.mutedScriptIds ?? [])],
      }));

      let found = false;
      let wasMuted = false;
      for (const g of favouriteGroups) {
        const idx = g.scriptIds.indexOf(scriptId);
        if (idx !== -1) {
          g.scriptIds.splice(idx, 1);
          const mutedIdx = g.mutedScriptIds.indexOf(scriptId);
          if (mutedIdx !== -1) {
            g.mutedScriptIds.splice(mutedIdx, 1);
            wasMuted = true;
          }
          found = true;
          break;
        }
      }
      if (!found) return state;

      const toGroup = favouriteGroups.find((g) => g.id === toGroupId);
      if (!toGroup) return state;

      const clamped = Math.max(0, Math.min(toIndex, toGroup.scriptIds.length));
      toGroup.scriptIds.splice(clamped, 0, scriptId);
      if (wasMuted && !toGroup.mutedScriptIds.includes(scriptId)) {
        toGroup.mutedScriptIds.push(scriptId);
      }
      persist({ ...state, favouriteGroups });
      return { favouriteGroups };
    }),

  toggleFavouriteMute: (groupId, scriptId) =>
    set((state) => {
      const favouriteGroups = state.favouriteGroups.map((g) => {
        if (g.id !== groupId) return g;
        if (!g.scriptIds.includes(scriptId)) return g;
        const muted = new Set(g.mutedScriptIds ?? []);
        if (muted.has(scriptId)) muted.delete(scriptId);
        else muted.add(scriptId);
        return { ...g, mutedScriptIds: Array.from(muted) };
      });
      persist({ ...state, favouriteGroups });
      return { favouriteGroups };
    }),

  setScriptDescription: (id, description) =>
    set((state) => {
      const scriptDescriptions = { ...state.scriptDescriptions };
      const trimmed = description.trim();
      if (trimmed) scriptDescriptions[id] = trimmed;
      else delete scriptDescriptions[id];
      persist({ ...state, scriptDescriptions });
      return { scriptDescriptions };
    }),

  forgetScriptId: (id) =>
    set((state) => {
      const favouriteGroups = state.favouriteGroups.map((g) => ({
        ...g,
        scriptIds: g.scriptIds.filter((s) => s !== id),
        mutedScriptIds: (g.mutedScriptIds ?? []).filter((s) => s !== id),
      }));
      const scriptDescriptions = { ...state.scriptDescriptions };
      delete scriptDescriptions[id];
      const hiddenScripts = state.hiddenScripts.filter((s) => s !== id);
      const selectedScriptId =
        state.selectedScriptId === id ? null : state.selectedScriptId;
      persist({
        ...state,
        favouriteGroups,
        scriptDescriptions,
        hiddenScripts,
      });
      return {
        favouriteGroups,
        scriptDescriptions,
        hiddenScripts,
        selectedScriptId,
      };
    }),

  renameScriptId: (oldId, newId) =>
    set((state) => {
      if (oldId === newId) return state;
      const favouriteGroups = state.favouriteGroups.map((g) => ({
        ...g,
        scriptIds: g.scriptIds.map((s) => (s === oldId ? newId : s)),
        mutedScriptIds: (g.mutedScriptIds ?? []).map((s) =>
          s === oldId ? newId : s
        ),
      }));
      const scriptDescriptions = { ...state.scriptDescriptions };
      if (oldId in scriptDescriptions) {
        scriptDescriptions[newId] = scriptDescriptions[oldId];
        delete scriptDescriptions[oldId];
      }
      const hiddenScripts = state.hiddenScripts.map((s) =>
        s === oldId ? newId : s
      );
      const selectedScriptId =
        state.selectedScriptId === oldId ? newId : state.selectedScriptId;
      persist({
        ...state,
        favouriteGroups,
        scriptDescriptions,
        hiddenScripts,
      });
      return {
        favouriteGroups,
        scriptDescriptions,
        hiddenScripts,
        selectedScriptId,
      };
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
