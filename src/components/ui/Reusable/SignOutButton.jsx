"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
  const { error } = await signOut();

  if (!error) {
    router.push("/sign-in");
    router.refresh();
  }
}

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-semibold rounded px-6 py-4 bg-[#1A1926]"
    >
      Sign Out
    </button>
  );
}