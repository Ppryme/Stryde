"use client";

import Spinner from "@/components/ui/Reusable/Spinner";
import useAppStore from "@/stores/useAppStore";

export default function GlobalLoadingOverlay() {
  const loading = useAppStore((state) => state.loading);
  const message = useAppStore((state) => state.loadingMessage);

  if (!loading) return null;

  return (
    <div className="max-w-full flex items-center justify-center fixed right-50 left-50 top-8">
      <div className=" flex items-center gap-6 ">
        <Spinner />

        <p className="text-sm font-medium text-white">
          {message} 
        </p>
      </div>
      </div>
    
  );
}