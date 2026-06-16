"use client";
 
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/auth";
 
export default function SignInPage() {
  const router = useRouter();
 
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
 
  async function handleSubmit() {
    setLoading(true);
    setError("");
 
    const { data, error } = await signIn(email, password);
 
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
 
    const user = data.user;
    if (user?.user_metadata?.onboarded) {
      router.push("/");
    } else {
      router.push("/onboarding");
    }
  }
 
  async function handleGoogle() {
    setLoading(true);
    const { error: authError } = await signInWithGoogle();
    if (authError) setError(authError.message);
    setLoading(false);
  }
 
  return (
    // Full screen centered layout — no bottom nav interference
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "var(--color-bento-bg)" }}
    >
      <div className="w-full max-w-md flex flex-col gap-6">
 
        {/* Header */}
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: "var(--color-bento-text)" }}
          >
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: "var(--color-bento-muted)" }}>
            Sign in to continue your streak.
          </p>
        </div>
 
        {/* Fields */}
        <div className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: "var(--color-bento-card)",
              border:     "1px solid var(--color-bento-border)",
              color:      "var(--color-bento-text)",
            }}
          />
        </div>
 
        {/* Error */}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
 
        {/* Sign in button */}
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
          {loading ? "Signing in..." : "Sign In"}
        </button>
 
        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--color-bento-border)" }} />
          <span className="text-xs" style={{ color: "var(--color-bento-muted)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-bento-border)" }} />
        </div>
 
        {/* Google button */}
        <button
          onClick={handleGoogle}
          className="w-full py-3.5 rounded-xl text-sm font-medium"
          style={{
            background: "transparent",
            border:     "1px solid var(--color-bento-border)",
            color:      "var(--color-bento-text)",
          }}
        >
          Continue with Google
        </button>
 
        {/* Link to SignUp — uses Next.js Link, not <a> */}
        <p className="text-sm text-center" style={{ color: "var(--color-bento-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-semibold"
            style={{ color: "var(--color--stryde-primary)" }}
          >
            Create one
          </Link>
        </p>
 
      </div>
    </div>
  );
}