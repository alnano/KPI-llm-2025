"use client";
import { useState } from "react";
import { openAuth } from "@/lib/openauth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pw }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data.detail || "Not able to log in. Please check your credentials.",
        );
        return;
      }

      location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("Unable to log in. Please try again later.");
    }
  };
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Password"
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {error && (
          <div className="text-red-600 text-sm text-center mb-2">{error}</div>
        )}
        <button className="w-full border p-2">Sign in</button>
      </form>

      <div className="text-center text-sm text-gray-500">or</div>

      <button
        className="w-full border p-2"
        onClick={() =>
          openAuth.signInWithGoogle({
            redirectUri: `${location.origin}/auth/callback`,
          })
        }
      >
        Continue with Google
      </button>
    </div>
  );
}
