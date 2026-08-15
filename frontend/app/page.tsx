"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRememberedAnalysisId } from "@/lib/analysisStorage";

/**
 * Task 8.2: app-root redirect. The remembered analysis ID is a convenience
 * only (design.md Decision #2) - if present, land on its dashboard;
 * otherwise send the candidate to start a new analysis.
 */
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const lastAnalysisId = getRememberedAnalysisId();
    router.replace(lastAnalysisId ? `/dashboard/${lastAnalysisId}` : "/start");
  }, [router]);

  return <main className="p-8 font-body-md text-body-md text-on-surface-variant">Loading...</main>;
}
