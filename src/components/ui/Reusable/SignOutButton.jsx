"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import useAppStore from "@/stores/useAppStore";
import "@/app/globals.css";

export default function SignOutButton() {
  const router = useRouter();

  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  async function handleSignOut() {
    showLoading("Signing out...");

    const start = Date.now();

    const { error } = await signOut();

    const elapsed = Date.now() - start;

    if (elapsed < 500) {
        await new Promise(resolve =>
            setTimeout(resolve, 500 - elapsed)
        );
    }

    if (!error) {
        router.push("/sign-in");
    }
}

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-semibold rounded-md px-4 py-3 sm:px-6 sm:py-4  bg-bento-bgSecondary"
    >
      Sign Out
    </button>
  );
}