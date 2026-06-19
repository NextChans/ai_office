"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CompanyIndex() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/c/${id}/office`);
  }, [id, router]);
  return <div className="py-20 text-center text-muted">오피스로 이동 중…</div>;
}
