import { useMemo } from "react";
import { getAppEnvironment } from "@/lib/device";

export function useDevice() {
  return useMemo(() => getAppEnvironment(), []);
}
