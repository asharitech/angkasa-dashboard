import { ACCOUNTS } from "@/lib/config";
import type { DataIntegrityIssue } from "@/lib/db/schema";
import { getCollections } from "./context";
import { getLedger } from "./ledgers";
import { dbDateToDateOnlyString } from "./serialize";
import type { LaporanOpReconciliation } from "./types";

export async function getLaporanOpReconciliation(): Promise<LaporanOpReconciliation | null> {
  const c = await getCollections();
  const ledger = await getLedger("laporan_op");
  if (!ledger?.laporan_op) return null;

  const account = ACCOUNTS.operasional;
  const agg = await c.entries
    .aggregate([
      { $match: { account } },
      {
        $group: {
          _id: "$direction",
          total: { $sum: "$amount" },
        },
      },
    ])
    .toArray();
  const entriesMasuk = agg.find((a) => a._id === "in")?.total ?? 0;
  const entriesKeluar = agg.find((a) => a._id === "out")?.total ?? 0;
  const ledgerMasuk = ledger.laporan_op.totals.masuk;
  const ledgerKeluar = ledger.laporan_op.totals.keluar;
  return {
    ledgerMasuk,
    ledgerKeluar,
    entriesMasuk,
    entriesKeluar,
    diffMasuk: entriesMasuk - ledgerMasuk,
    diffKeluar: entriesKeluar - ledgerKeluar,
    account,
    asOf: dbDateToDateOnlyString(ledger.as_of),
  };
}

export async function getDataIntegrityIssues(): Promise<DataIntegrityIssue[]> {
  const c = await getCollections();
  const issues: DataIntegrityIssue[] = [];

  const lunasOrphan = await c.obligations
    .find({
      status: "lunas",
      $or: [{ resolved_at: { $in: [null] } }, { resolved_at: { $exists: false } }],
    })
    .toArray();
  for (const o of lunasOrphan) {
    issues.push({
      kind: "lunas_missing_resolved_at",
      severity: "error",
      message: `Obligation lunas tanpa resolved_at: ${o.item}`,
      entity_id: o._id.toString(),
      hint: "Set resolved_at + resolved_by, atau revert ke pending",
    });
  }

  const pengajuanNoSumber = await c.obligations.countDocuments({
    type: "pengajuan",
    status: "pending",
    $or: [{ sumber_dana: null }, { sumber_dana: { $exists: false } }],
  });
  if (pengajuanNoSumber > 0) {
    issues.push({
      kind: "pengajuan_missing_sumber_dana",
      severity: "warn",
      message: `${pengajuanNoSumber} pengajuan pending tanpa sumber_dana`,
      hint: "Tag sumber_dana untuk routing yang benar",
    });
  }

  const sewaUntagged = await c.entries.countDocuments({
    category: "sewa_masuk",
    $or: [{ tahap_sewa: null }, { tahap_sewa: { $exists: false } }, { tahap_sewa: "UNKNOWN" }],
  });
  if (sewaUntagged > 0) {
    issues.push({
      kind: "sewa_untagged",
      severity: "warn",
      message: `${sewaUntagged} sewa_masuk entries tanpa tahap_sewa`,
      hint: "Run scripts/migrations/004_backfill_tahap_sewa.py --commit",
    });
  }

  const t5pre = await c.entries.countDocuments({
    category: "sewa_masuk",
    tahap_sewa: "2026-T5_PRE",
  });
  if (t5pre > 0) {
    issues.push({
      kind: "sewa_t5_pre_gap",
      severity: "info",
      message: `${t5pre} sewa entries jatuh di gap Mar 10-29 (T5_PRE)`,
      hint: "Konfirmasi ke Pak Angkasa: tahap sebenarnya untuk window ini",
    });
  }

  const loanNoSchedule = await c.obligations.countDocuments({
    type: "loan",
    status: "active",
    $or: [{ schedule: null }, { schedule: { $size: 0 } }],
  });
  if (loanNoSchedule > 0) {
    issues.push({
      kind: "loan_missing_schedule",
      severity: "warn",
      message: `${loanNoSchedule} loan aktif tanpa schedule array`,
    });
  }

  const oldBalance = await c.ledgers.countDocuments({ type: "balance" });
  if (oldBalance > 0) {
    issues.push({
      kind: "stale_balance_ledger",
      severity: "error",
      message: `${oldBalance} ledger doc masih type=balance (harus archived)`,
      hint: "Run scripts/migrations/006_archive_balance_ledger.py --commit",
    });
  }

  return issues;
}
