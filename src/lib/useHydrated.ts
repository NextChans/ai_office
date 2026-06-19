"use client";

import { useEffect, useState } from "react";

/** Guards against SSR/CSR hydration mismatches when reading persisted state. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
