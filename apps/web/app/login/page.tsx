"use client";
import { useState } from "react";
import { openAuth } from "@/lib/openauth";
import { api } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  //should have UI to check when wrong password provided
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await api("/auth/login", {
            method: "POST",
            body: JSON.stringify({ email, password: pw }),
            headers: { "Content-Type": "application/json" },
          });
          location.href = "/dashboard";
        }}
        className="space-y-2"
      >
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
