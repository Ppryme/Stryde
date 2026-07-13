"use client";
import { useEffect } from "react";
import useAppStore from "@/stores/useAppStore";



export default function ResetGlobalLoading() {
     const hideLoading = useAppStore(state => state.hideLoading);

    useEffect(() => {
        hideLoading();
    }, [hideLoading]);

    return null;
}