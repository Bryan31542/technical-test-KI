"use client";

import { useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      window.location.replace("/login");
      return;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <p className="text-sm text-zinc-500" data-testid="auth-loading">
        Comprobando sesión…
      </p>
    );
  }

  return children;
}
