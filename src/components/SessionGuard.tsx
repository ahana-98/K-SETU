"use client";

import { useEffect, useState } from "react";

export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setChecking(true);

      try {
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "same-origin",
          cache: "no-store",
        });

        if (!response.ok) {
          window.location.replace("/login");
          return;
        }

        setChecking(false);
      } catch {
        window.location.replace("/login");
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        void checkSession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-sm font-medium text-sage">
          Checking your session...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}