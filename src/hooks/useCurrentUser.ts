"use client";

import { useSearchParams } from "next/navigation";

export function useCurrentUser(): string | null {
  const searchParams = useSearchParams();
  return searchParams.get("userId");
}
