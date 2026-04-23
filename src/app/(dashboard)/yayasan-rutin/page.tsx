import { getObligations } from "@/lib/data";
import { PageHeader } from "@/components/page-header";
import { Repeat } from "lucide-react";
import { YayasanRutinManager } from "@/components/yayasan-rutin-manager";
import { getDefaultYayasanRoutineGroups } from "@/lib/yayasan-rutin";

export const dynamic = "force-dynamic";

export default async function YayasanRutinPage() {
  const obligations = await getObligations({
    type: "recurring",
    org: "yrbb",
    category: "wajib_bulanan_yayasan",
    is_active: true,
  });

  return (
    <div className="space-y-5">
      <PageHeader icon={Repeat} title="Wajib Bulanan Yayasan" />
      <YayasanRutinManager obligations={obligations} seeds={getDefaultYayasanRoutineGroups()} />
    </div>
  );
}
