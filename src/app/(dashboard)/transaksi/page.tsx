import { redirect } from "next/navigation";

export default async function TransaksiPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams({ type: "entry" });
  if (params.domain && params.domain !== "all") qs.set("domain", params.domain);
  redirect(`/aktivitas?${qs.toString()}`);
}
