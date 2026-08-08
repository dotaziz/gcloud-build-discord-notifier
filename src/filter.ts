import type { Build, FilterConfig } from "./types";


export type Predicate = (build: Build) => boolean;

export function compileFilter(cfg: FilterConfig | undefined): Predicate {
  if (!cfg) return () => true; // no filter configured => notify on everything

  const statuses = cfg.statuses ? new Set(cfg.statuses) : undefined;
  const subs = cfg.substitutions ? Object.entries(cfg.substitutions) : undefined;

  return (build: Build): boolean => {
    if (statuses && !statuses.has(build.status)) return false;
    if (subs) {
      for (const [key, want] of subs) {
        if (build.substitutions?.[key] !== want) return false;
      }
    }
    return true;
  };
}
