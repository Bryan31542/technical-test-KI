"use client";

import { useEffect, useRef } from "react";

export function usePoll(callback: () => void, ms: number) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const run = () => {
      if (document.visibilityState === "hidden") {
        return;
      }
      callbackRef.current();
    };

    const id = window.setInterval(run, ms);
    document.addEventListener("visibilitychange", run);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", run);
    };
  }, [ms]);
}
