import { useCallback, useMemo, useState } from "react";

export const useProgress = (totalArg?: number) => {
  const [progress, setProgress] = useState({ total: totalArg, progress: 0 });
  const progressPercentage = useMemo(
    () =>
      progress.total
        ? Math.trunc((progress.progress / progress.total) * 100)
        : 0,
    [progress]
  );
  const onProgress = useCallback(
    (progress: number, total: number) => setProgress({ progress, total }),
    []
  );
  return { progressPercentage, onProgress };
};
