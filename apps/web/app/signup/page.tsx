"use client";
import { useState } from "react";
import { openAuth } from "@/lib/openauth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const p = pw ?? "";
    const c = pw2 ?? "";
    if (p.length <= 4) return "Password must be greater than 4 characters.";
    if (p !== c) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    setLoading(true);
    try {
      const res = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password: pw }),
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (
          res.status === 409 ||
          data.detail?.toLowerCase().includes("registered")
        ) {
          setError("An account with this email already exists.");
          return;
        }

        setError(
          data.detail ||
            "Could not sign up. Please check your info and try again.",
        );
        return;
      }

      location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError(`Network error. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Sign up</h1>

      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="w-full border p-2"
          placeholder="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full border p-2"
          placeholder="Password"
          type="password"
          autoComplete="new-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />

        <input
          className="w-full border p-2"
          placeholder="Confirm password"
          type="password"
          autoComplete="new-password"
          value={pw2}
          onChange={(e) => setPw2(e.target.value)}
        />

        {error && (
          <div
            className="text-red-600 text-sm text-center mb-2"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        <button
          className="w-full border p-2 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
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
