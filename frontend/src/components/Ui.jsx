export function SectionHeading({ eyebrow, title, action, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>{eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-teal-600">{eyebrow}</p>}<h2 className="section-title">{title}</h2>{children && <p className="mt-1 text-sm text-slate-500">{children}</p>}</div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, detail, tone = "teal", icon }) {
  const tones = { teal: "bg-teal-50 text-teal-700", coral: "bg-coral-50 text-coral-600", blue: "bg-blue-50 text-blue-600", amber: "bg-amber-50 text-amber-700" };
  return (
    <div className="card flex items-start justify-between animate-float-in">
      <div><p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink">{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</div>
      <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${tones[tone]}`}>{icon}</span>
    </div>
  );
}

export function RiskBadge({ label }) {
  const styles = { High: "bg-red-100 text-red-700", Medium: "bg-amber-100 text-amber-700", Low: "bg-emerald-100 text-emerald-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${styles[label] || "bg-slate-100 text-slate-600"}`}>{label}</span>;
}

export const formatDate = (value) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

