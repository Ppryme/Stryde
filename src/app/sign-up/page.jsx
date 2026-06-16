"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  async function handleSubmit() {
    setLoading(true);

    const { error } = await signUp(
      email,
      password,
      name
    );

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  return (

    <div className="min-h-screen flex flex-col items-center justify-center px-6">

    
    <div className="w-full max-w-md flex flex-col mx-auto gap-6">
      <h1 className="text-3xl font-bold ">
        Build Streaks.
      </h1>

      <p className="text-sm ">
        Create your account.
      </p>

      <div className="flex flex-col gap-4">

        <input
          placeholder="Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
              background: "var(--color-bento-card)",
              border:     "1px solid var(--color-bento-border)",
              color:      "var(--color-bento-text)",
            }}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
              background: "var(--color-bento-card)",
              border:     "1px solid var(--color-bento-border)",
              color:      "var(--color-bento-text)",
            }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="px-4 py-3 rounded-xl"
          style={{
              background: "var(--color-bento-card)",
              border:     "1px solid var(--color-bento-border)",
              color:      "var(--color-bento-text)",
            }}
        />

        {error && (
          <p className="text-red-500 text-sm">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-xl text-sm font-semibold transition-opacity"
          style={{
            background: "var(--color--stryde-primary)",
            color:      "#fff",
            opacity:    loading ? 0.7 : 1,
          }}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

      </div>

      <p className="text-sm text-center"
          style={{ color: "var(--color-bento-muted)" }}
      >
        Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold"
             style={{ color: "var(--color--stryde-primary)" }}
          >
            Sign in
          </Link>
      </p>
    </div>
    </div>
  );
}