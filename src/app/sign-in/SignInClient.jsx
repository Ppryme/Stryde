"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn, signInWithGoogle } from "@/lib/auth";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";




export default function SignInClient({authError}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(authError || "");

  async function handleSubmit() {
    setLoading(true);
    setError("");

    const { data, error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user?.user_metadata?.onboarded) {
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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-bento-bg">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-bento-text">
            Welcome Back
          </h1>
          <p className="text-sm text-bento-muted">
            Sign in to continue your streak.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-xs font-medium text-bento-muted"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <FormError message={error} className="mt-0" />

        <Button onClick={handleSubmit} disabled={loading} className="w-full py-4 rounded-xl text-sm">
          {loading ? "Signing in..." : "Sign In"}
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-bento-border" />
          <span className="text-xs text-bento-muted">or</span>
          <div className="flex-1 h-px bg-bento-border" />
        </div>

        <Button onClick={handleGoogle} variant="outline" className="w-full py-3.5 rounded-xl text-sm">
          Continue with Google
        </Button>

        <p className="text-sm text-center text-bento-muted">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-semibold text-stryde-primary">
            Create one
          </Link>
        </p>

        {authError === "auth_failed" && (
        <p className="text-red-400 text-sm">
          Google sign in failed. Please try again.
        </p>
        )}
      </div>
    </div>
  );
}