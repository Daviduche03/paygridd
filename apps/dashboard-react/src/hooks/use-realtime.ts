"use client";

// Supabase completely removed - realtime disabled for now
import { useEffect } from "react";

export function useRealtime<TN extends string>(_props: any) {
  useEffect(() => {
    // no-op
    return () => {};
  }, []);
}
