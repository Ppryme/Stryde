"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth";
import useAppStore from "@/stores/useAppStore";

export default function SignOutButton() {
  const router = useRouter();

  const showLoading = useAppStore((state) => state.showLoading);
  const hideLoading = useAppStore((state) => state.hideLoading);

  async function handleSignOut() {
  const { error } = await signOut();

   showLoading("Signing out...");

  if (!error) {
    router.push("/sign-in");
    router.refresh();
  }

    hideLoading();
}

  return (
    <button
      onClick={handleSignOut}
      className="text-sm font-semibold rounded px-6 py-4 bg-bento-bgSecondary"
    >
      Sign Out
    </button>
  );
}