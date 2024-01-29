import { useCallback, useState } from "react";

const calculate = (progress: number, total: number) =>
  total ? Math.trunc((progress / total) * 100) : 0;

export const useMultipleProgress = () => {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const onProgress = useCallback(
    (id: string, progress: number, total: number) =>
      setProgressMap((m) => ({ ...m, [id]: calculate(progress, total) })),
    []
  );

  return { progressMap, onProgress };
};
