"use client";
import { useState, useEffect } from "react";

export function useOnline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const check = async () => {
    try {
            const res = await fetch("/api/health", {
              method: "HEAD",      // or GET – either works
              cache: "no-store",   // prevents caching of the response
            });
            setIsOnline(res.ok);
          } catch {
            setIsOnline(false);
          }
        };

    check(); // initial check
    const interval = setInterval(check, 30000); // every 30 sec
    window.addEventListener("online", check);
    window.addEventListener("offline", () => setIsOnline(false));

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", check);
      window.removeEventListener("offline", () => setIsOnline(false));
    };
  }, []);

  return isOnline;
}