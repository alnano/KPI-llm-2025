"use client";
import { useEffect } from "react";

export default function Callback() {
  useEffect(() => {
    (async () => {
      const qs = new URLSearchParams(location.search);
      const code = qs.get("code");
      if (!code) {
        location.replace("/login?e=missing_code");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/oidc/google/code`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            redirect_uri: `${location.origin}/auth/callback`,
          }),
        },
      );

      if (res.ok) location.replace("/dashboard");
      else location.replace("/login?e=exchange_failed");
    })();
  }, []);
  return <p>Finishing sign-in…</p>;
}
