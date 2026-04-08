export interface ScriptGroup {
  prefix: string | null; // null = standalone script
  scripts: Array<[string, string]>; // [name, command]
}

/**
 * Groups scripts by their common prefix (before first :, -, or _).
 * Only groups if 2+ scripts share a prefix. Singletons stay standalone.
 * Preserves original ordering within groups.
 */
export function groupScripts(
  scripts: Array<[string, string]>
): ScriptGroup[] {
  // Build a map: prefix -> all scripts that belong to it
  // A script belongs to a prefix if:
  //   - its name equals the prefix exactly (e.g. "build")
  //   - its name starts with prefix + delimiter (e.g. "build:dev", "build-prod", "build_ci")
  const prefixMembers = new Map<string, Array<[string, string]>>();

  for (const [name, command] of scripts) {
    const prefix = getPrefix(name);
    if (prefix) {
      if (!prefixMembers.has(prefix)) {
        prefixMembers.set(prefix, []);
      }
      prefixMembers.get(prefix)!.push([name, command]);
    }
  }

  // Also check: if a base script exists with no delimiter (e.g. "build"),
  // it should be included in the group for that prefix
  for (const [name, command] of scripts) {
    if (getPrefix(name) !== null) continue; // already has a delimiter, handled above
    if (prefixMembers.has(name)) {
      // This exact name is a prefix for other scripts — add it to front of group
      const members = prefixMembers.get(name)!;
      if (!members.some(([n]) => n === name)) {
        members.unshift([name, command]);
      }
    }
  }

  // Only keep groups with 2+ members
  const validPrefixes = new Set<string>();
  for (const [prefix, members] of prefixMembers) {
    if (members.length >= 2) {
      validPrefixes.add(prefix);
    }
  }

  // Build groups in order of first appearance
  const groups: ScriptGroup[] = [];
  const placed = new Set<string>();

  for (const [name] of scripts) {
    if (placed.has(name)) continue;

    // Determine which group this script belongs to
    const prefix = getPrefix(name);
    const groupPrefix = prefix && validPrefixes.has(prefix)
      ? prefix
      : validPrefixes.has(name)
        ? name
        : null;

    if (groupPrefix) {
      const members = prefixMembers.get(groupPrefix)!;
      groups.push({ prefix: groupPrefix, scripts: members });
      for (const [n] of members) placed.add(n);
    } else {
      const entry = scripts.find(([n]) => n === name)!;
      groups.push({ prefix: null, scripts: [entry] });
      placed.add(name);
    }
  }

  return groups;
}

function getPrefix(name: string): string | null {
  const match = name.match(/^([a-zA-Z0-9]+)[:_-]/);
  return match ? match[1] : null;
}
