"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth";
import Button from "@/components/ui/button";
import FormError from "@/components/ui/FormError";
import Input from "@/components/ui/Input";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!navigator.onLine) {
      setError("You're offline. Connect to the internet.");
      return;
    }

    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
    setError("Passwords do not match.");
    setLoading(false);
    return;
  }

    const { error } = await signUp(email, password, name);

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
        <div>
          <h1 className="text-3xl font-bold text-bento-text">
            Build Streaks.
          </h1>
          <p className="text-sm text-bento-muted">
            Create your account.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            autoComplete="name"
          />

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
              autoComplete="new-password"
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

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pr-12"
              autoComplete="new-password"
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

          <FormError message={error} className="text-sm mt-0" />

          <Button onClick={handleSubmit} disabled={loading || !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()} className="w-full py-4 rounded-xl text-sm">
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </div>

        <p className="text-sm text-center text-bento-muted">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-stryde-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
