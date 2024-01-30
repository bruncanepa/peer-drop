import { useCallback, useEffect } from "react";

export const useOnTabUnloaded = (showAlert: boolean, cb?: Function) => {
  const handleTabUnloaded = useCallback(
    // 'handleTabClose' was created with this https://developer.mozilla.org/en-US/docs/Web/API/BeforeUnloadEvent
    (event: BeforeUnloadEvent) => {
      if (showAlert) {
        event.preventDefault();
        // Included for legacy support, e.g. Chrome/Edge < 119
        event.returnValue = true;
        if (cb) cb();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [showAlert]
  );

  useEffect(() => {
    window.addEventListener("beforeunload", handleTabUnloaded);
    return () => {
      window.removeEventListener("beforeunload", handleTabUnloaded);
    };
  }, [handleTabUnloaded]);
};
