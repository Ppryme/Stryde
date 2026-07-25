"use client";
import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";



export default function ResetGlobalLoading() {
     const hideLoading = useAppStore(state => state.hideLoading);
       const isOpen = useAppStore((state) => state.celebrationOpen);
        const setOpen = useAppStore((state) => state.setOpenCelebration);

    useEffect(() => {
        hideLoading();
        setOpen(false);
    }, [hideLoading, setOpen]);

    return null;
}