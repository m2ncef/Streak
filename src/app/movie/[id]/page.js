"use client";
import dynamic from "next/dynamic";

const Title = dynamic(() => import("@/views/Title"), { ssr: false });
export default function Page() {
  return <Title kind="movie" />;
}
