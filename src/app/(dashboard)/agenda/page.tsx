import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KATEGORI_CONFIG } from "@/lib/agenda-config";
import type { AgendaDoc } from "@/components/agenda-manager";
import type { AgendaKategori } from "@/lib/actions/agenda";
import { Plus, CheckCircle2, Circle, Search, LayoutGrid, Calendar, MoreHorizontal } from "lucide-react";
import { formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AgendaPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const db = await getDb();
  const rawDocs = await db
    .collection("agenda")
    .find({ owner: "angkasa" })
    .sort({ due_date: 1, created_at: -1 })
    .toArray();

  const all = rawDocs.map((d) => ({
    ...d,
    _id: d.toString(),
    created_at: d.created_at instanceof Date ? d.created_at.toISOString() : (d.created_at ?? null),
  })) as unknown as AgendaDoc[];

  const overdue = all.filter(a => a.status !== "selesai" && new Date(a.due_date) < new Date(new Date().setHours(0,0,0,0)));
  const pending = all.filter(a => a.status === "belum" && a.priority !== "tinggi");
  const inProgress = all.filter(a => a.status === "belum" && a.priority === "tinggi"); // Mock for demo
  const done = all.filter(a => a.status === "selesai");

  return (
    <main className="content" data-screen-label="07 Agenda & Tasks">
      <div className="page-head">
        <div>
          <div className="t-eyebrow" style={{ marginBottom: "var(--sp-2)" }}>Personal Productivity · Workspace</div>
          <h1 className="page-head__title">Agenda & Tasks</h1>
          <div className="page-head__sub">{pending.length} pending · {done.length} selesai · sinkron dengan laporan yayasan</div>
        </div>
        <div className="page-head__actions">
          <button className="btn btn--secondary"><LayoutGrid className="btn__icon"/> Board</button>
          <button className="btn btn--primary"><Plus className="btn__icon"/> Task baru</button>
        </div>
      </div>

      <div className="filter-bar">
        <div className="input__wrap">
          <Search className="input__icon" />
          <input placeholder="Cari task, assign, atau tag…" />
        </div>
        <button className="btn btn--secondary">Kategori <span style={{ color: "var(--ink-400)", marginLeft: 4 }}>Semua</span></button>
        <button className="btn btn--secondary">Due Date <span style={{ color: "var(--ink-400)", marginLeft: 4 }}>Any time</span></button>
      </div>

      <div className="board">
        {/* Backlog/Pending */}
        <div className="board-col">
          <div className="board-col__head">
            <span className="board-col__title">To Do</span>
            <span className="board-col__count">{pending.length}</span>
            <button className="btn btn--ghost" style={{ padding: 4, height: "auto" }}><Plus className="w-4 h-4"/></button>
          </div>
          <div className="board-col__body">
            {pending.map(task => {
              const cfg = KATEGORI_CONFIG[task.kategori as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
              const isOverdue = new Date(task.due_date) < new Date(new Date().setHours(0,0,0,0));
              return (
                <div className="card" key={task._id.toString()}>
                  <div className="card__head">
                    <span className="card__tag">{cfg.label}</span>
                    <MoreHorizontal className="card__more" />
                  </div>
                  <div className="card__title">{task.title}</div>
                  {task.description && <div className="card__desc">{task.description}</div>}
                  <div className="card__meta">
                    <span className="card__date" style={{ color: isOverdue ? "var(--neg-700)" : undefined }}>
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateShort(task.due_date)} {isOverdue && "(Terlambat)"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* In Progress */}
        <div className="board-col">
          <div className="board-col__head">
            <span className="board-col__title">In Progress</span>
            <span className="board-col__count">{inProgress.length}</span>
            <button className="btn btn--ghost" style={{ padding: 4, height: "auto" }}><Plus className="w-4 h-4"/></button>
          </div>
          <div className="board-col__body">
            {/* Empty state for demo if none */}
            {inProgress.length === 0 && <div className="p-4 text-center text-sm text-ink-400">Drag task ke sini.</div>}
            {inProgress.map(task => {
              const cfg = KATEGORI_CONFIG[task.kategori as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
              return (
                <div className="card" key={task._id.toString() + "_prog"}>
                  <div className="card__head">
                    <span className="card__tag" style={{ background: "var(--warn-100)", color: "var(--warn-800)" }}>{cfg.label}</span>
                    <MoreHorizontal className="card__more" />
                  </div>
                  <div className="card__title">{task.title}</div>
                  <div className="card__meta">
                    <span className="card__date"><Calendar className="w-3.5 h-3.5" />{formatDateShort(task.due_date)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Done */}
        <div className="board-col">
          <div className="board-col__head">
            <span className="board-col__title">Selesai</span>
            <span className="board-col__count">{done.length}</span>
          </div>
          <div className="board-col__body">
            {done.map(task => {
              const cfg = KATEGORI_CONFIG[task.kategori as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
              return (
                <div className="card is-done" key={task._id.toString()}>
                  <div className="card__head">
                    <span className="card__tag" style={{ background: "var(--pos-100)", color: "var(--pos-800)" }}>{cfg.label}</span>
                  </div>
                  <div className="card__title" style={{ textDecoration: "line-through", color: "var(--ink-400)" }}>{task.title}</div>
                  <div className="card__meta">
                    <span className="card__date text-pos"><CheckCircle2 className="w-3.5 h-3.5" /> Selesai</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
