import { useEffect } from "react";
import { fetchConfig, fetchPackages, fetchStatuses } from "../lib/api";
import { useStore } from "../store/scripts";

export function useInitialize() {
  const setConfig = useStore((s) => s.setConfig);
  const setPackages = useStore((s) => s.setPackages);
  const initFromStatuses = useStore((s) => s.initFromStatuses);

  useEffect(() => {
    Promise.all([fetchConfig(), fetchPackages(), fetchStatuses()]).then(
      ([config, packages, statuses]) => {
        setConfig(config);
        setPackages(packages);
        initFromStatuses(statuses);
      }
    );
  }, [setConfig, setPackages, initFromStatuses]);
}
