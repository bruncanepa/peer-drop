import { useCallback, useEffect, useRef, useState } from "react";

const calculate = (progress: number, total: number) =>
  total ? Math.trunc((progress / total) * 100) : 0;

export const useMultipleProgress = (quantity: number, onEnd?: () => any) => {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const endedRef = useRef(false);

  const onProgress = useCallback(
    (id: string, progress: number, total: number) =>
      setProgressMap((m) => ({ ...m, [id]: calculate(progress, total) })),
    []
  );

  const onReset = useCallback(() => setProgressMap({}), []);

  useEffect(() => {
    if (
      quantity > 0 &&
      Object.keys(progressMap).length === quantity &&
      Object.values(progressMap).every((v) => v === 100) &&
      !endedRef.current
    ) {
      endedRef.current = true;
      if (onEnd) onEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressMap, quantity]);

  console.log(progressMap);

  return { progressMap, onProgress, onReset };
};
