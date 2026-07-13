"use client";

import Spinner from "@/components/ui/Reusable/Spinner";
import useAppStore from "@/stores/useAppStore";

export default function GlobalLoadingOverlay() {
  const loading = useAppStore((state) => state.loading);
  const message = useAppStore((state) => state.loadingMessage);

  if (!loading) return null;

  return (
    <div className=" flex items-center justify-center ">
      <div className=" flex items-center justify-center gap-8 px-10 py-4 ">
        <Spinner />

        <p className="text-sm font-medium text-white nowrap">
          {message} 
        </p>
      </div>
      </div>
    
  );
}