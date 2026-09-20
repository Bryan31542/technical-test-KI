"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearBasicToken, isLoggedIn } from "@/lib/auth";

export function LogoutButton() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isLoggedIn());
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      data-testid="logout"
      className="text-sm text-zinc-600 hover:text-zinc-900 hover:underline"
      onClick={() => {
        clearBasicToken();
        router.replace("/login");
      }}
    >
      Cerrar sesión
    </button>
  );
}
