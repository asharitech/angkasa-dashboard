import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { KATEGORI_CONFIG } from "@/lib/agenda-config";
import { PageHeader } from "@/components/page-header";
import { ToneBadge } from "@/components/tone-badge";
import type { AgendaDoc } from "@/components/agenda-manager";
import { AgendaCreateButton, AgendaCheckToggle, AgendaMenuActions } from "@/components/agenda-manager";
import type { AgendaKategori } from "@/lib/actions/agenda";
import { Plus, CheckCircle2, Search, Calendar, MoreHorizontal } from "lucide-react";
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
  const inProgress = all.filter(a => a.status === "belum" && a.priority === "tinggi");
  const done = all.filter(a => a.status === "selesai");

  return (
    <main className="content" data-screen-label="07 Agenda & Tasks">
      <PageHeader 
        eyebrow="Pribadi · Task Tracker"
        title="Agenda"
        subtitle={`Catatan harian & deadline pribadi — sinkron dengan kalender WITA · ${formatDateShort(new Date().toISOString())}`}
      >
        <button className="btn btn--secondary">
          <Calendar className="btn__icon" /> Kalender
        </button>
        <AgendaCreateButton />
      </PageHeader>

      <div className="ag-hero">
        <div className="ag-hero__main">
          <div className="ag-hero__eyebrow">Beban · Agenda Terbuka</div>
          <div className="ag-hero__amount">
            {pending.length + inProgress.length + overdue.length}<span className="total">/{all.length}</span>
          </div>
          <div className="ag-hero__sub">
            <span><span className="fig">{done.length}</span> selesai total</span>
            <span>Avg completion · <span className="fig">3.2 hari</span></span>
          </div>
        </div>
        <div className="ag-hero__side">
          <div className="ag-kpi">
            <div className="ag-kpi__label">Mendesak</div>
            <div className="ag-kpi__value ag-kpi__value--neg">{overdue.length}</div>
            <div className="ag-kpi__meta">{overdue.length} terlambat</div>
          </div>
          <div className="ag-kpi">
            <div className="ag-kpi__label">Selesai</div>
            <div className="ag-kpi__value ag-kpi__value--pos">{done.length}</div>
            <div className="ag-kpi__meta">Total agenda tertutup</div>
          </div>
          <div className="ag-progress">
            <div className="ag-progress__head">
              <span className="ag-progress__label">Progress Keseluruhan · {all.length} agenda</span>
              <span className="ag-progress__value">{done.length}/{all.length} selesai <span className="pct">{Math.round((done.length / Math.max(all.length, 1)) * 100)}%</span></span>
            </div>
            <div className="ag-progress__bar"><div className="ag-progress__fill" style={{ width: `${(done.length / Math.max(all.length, 1)) * 100}%` }}></div></div>
            <div className="ag-progress__ticks">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="ag-toolbar">
        <div className="ag-search">
          <Search className="w-4 h-4 text-ink-400" />
          <input placeholder="Cari judul, keterangan, tag..." />
          <span className="badge badge--outline" style={{ fontFamily: "var(--font-mono)", padding: "0 5px", height: "18px", fontSize: "10px" }}>⌘F</span>
        </div>
        <div className="ag-tabs">
          <button className="ag-tabs__btn is-active">Belum selesai <span className="count">{pending.length + inProgress.length + overdue.length}</span></button>
          <button className="ag-tabs__btn">Selesai <span className="count">{done.length}</span></button>
          <button className="ag-tabs__btn">Semua <span className="count">{all.length}</span></button>
        </div>
      </div>

      <div className="ag-controls">
        <div className="ag-chips">
          <button className="ag-chip is-active"><span className="ag-chip__glyph" style={{ background: "var(--ink-000)", color: "var(--surface)", borderRadius: "3px" }}>★</span>Semua<span className="ag-chip__count">{all.length}</span></button>
          <button className="ag-chip"><span className="ag-chip__glyph" style={{ background: "#4338ca", color: "#fff", borderRadius: "3px" }}>Y</span>Yayasan</button>
          <button className="ag-chip"><span className="ag-chip__glyph" style={{ background: "var(--pos-500)", color: "#fff", borderRadius: "3px" }}>$</span>Keuangan</button>
          <button className="ag-chip"><span className="ag-chip__glyph" style={{ background: "#0284c7", color: "#fff", borderRadius: "3px" }}>P</span>Pribadi</button>
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="ag-section">
          <div className="ag-section__head">
            <span className="ag-section__label ag-section__label--urgent">
              <span className="ag-section__glyph"></span>
              Terlambat
            </span>
            <span className="ag-section__count">{overdue.length} agenda</span>
            <span className="ag-section__total">Priority · High bias</span>
          </div>
          <div className="ag-frame">
            {overdue.map(task => {
              const cfg = KATEGORI_CONFIG[task.kategori as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
              return (
                <div className={`ag-item ag-item--p-${task.priority === "tinggi" ? "tinggi" : "sedang"}`} key={task._id.toString()}>
                  <AgendaCheckToggle agenda={task} />
                  <div>
                    <div className="ag-date">{new Date(task.due_date).getDate()} {new Date(task.due_date).toLocaleString('id-ID', { month: 'short' })}</div>
                    <span className="ag-countdown ag-countdown--late">Terlambat</span>
                  </div>
                  <div className="ag-item__body">
                    <div className="ag-item__title">{task.title}</div>
                    {task.description && <div className="ag-item__desc">{task.description}</div>}
                  </div>
                  <div className={`ag-pri ag-pri--${task.priority}`}><span className="ag-pri__dot"></span>{task.priority || "Normal"}</div>
                  <div className="ag-cat"><span className="ag-cat__glyph" style={{ background: "#4338ca" }}>{cfg.label.charAt(0)}</span>{cfg.label}</div>
                  <div className="ag-actions">
                    <AgendaMenuActions agenda={task} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="ag-section">
          <div className="ag-section__head">
            <span className="ag-section__label">
              <span className="ag-section__glyph"></span>
              Mendatang
            </span>
            <span className="ag-section__count">{pending.length} agenda</span>
          </div>
          <div className="ag-frame">
            {pending.map(task => {
              const cfg = KATEGORI_CONFIG[task.kategori as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
              return (
                <div className={`ag-item ag-item--p-${task.priority === "tinggi" ? "tinggi" : "sedang"}`} key={task._id.toString()}>
                  <AgendaCheckToggle agenda={task} />
                  <div>
                    <div className="ag-date">{new Date(task.due_date).getDate()} {new Date(task.due_date).toLocaleString('id-ID', { month: 'short' })}</div>
                    <span className="ag-countdown ag-countdown--normal">Pending</span>
                  </div>
                  <div className="ag-item__body">
                    <div className="ag-item__title">{task.title}</div>
                    {task.description && <div className="ag-item__desc">{task.description}</div>}
                  </div>
                  <div className={`ag-pri ag-pri--${task.priority}`}><span className="ag-pri__dot"></span>{task.priority || "Normal"}</div>
                  <div className="ag-cat"><span className="ag-cat__glyph" style={{ background: "var(--ink-400)" }}>{cfg.label.charAt(0)}</span>{cfg.label}</div>
                  <div className="ag-actions">
                    <AgendaMenuActions agenda={task} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="ag-section" style={{ opacity: 0.8 }}>
          <div className="ag-section__head">
            <span className="ag-section__label">
              <span className="ag-section__glyph"></span>
              Selesai
            </span>
            <span className="ag-section__count">{done.length} agenda</span>
          </div>
          <div className="ag-frame">
            {done.map(task => {
              const cfg = KATEGORI_CONFIG[task.kategori as AgendaKategori] ?? KATEGORI_CONFIG.lainnya;
              return (
                <div className="ag-item ag-item--done" key={task._id.toString()}>
                  <AgendaCheckToggle agenda={task} />
                  <div>
                    <div className="ag-date">{new Date(task.due_date).getDate()} {new Date(task.due_date).toLocaleString('id-ID', { month: 'short' })}</div>
                  </div>
                  <div className="ag-item__body">
                    <div className="ag-item__title">{task.title}</div>
                  </div>
                  <div className="ag-pri ag-pri--rendah"><span className="ag-pri__dot"></span>Done</div>
                  <div className="ag-cat"><span className="ag-cat__glyph" style={{ background: "var(--pos-500)" }}>{cfg.label.charAt(0)}</span>{cfg.label}</div>
                  <div className="ag-actions">
                    <AgendaMenuActions agenda={task} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
