import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api/client.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { EmptyState, ErrorPanel, Loader } from "../../components/Feedback.jsx";
import { formatDate, RiskBadge, SectionHeading, StatCard } from "../../components/Ui.jsx";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    setError(null);
    api.get("/dashboard/student").then(({ data: response }) => setData(response)).catch(setError);
  }, []);
  useEffect(load, [load]);

  const stats = useMemo(() => {
    if (!data) return {};
    const averageAttendance = data.attendance.length ? Math.round(data.attendance.reduce((sum, row) => sum + row.percentage, 0) / data.attendance.length) : 0;
    const averageGrade = data.marks.length ? Math.round(data.marks.reduce((sum, mark) => sum + mark.score / mark.maxScore * 100, 0) / data.marks.length) : 0;
    return { averageAttendance, averageGrade };
  }, [data]);

  return (
    <DashboardLayout title="Student dashboard" subtitle="Your academic pulse, all in one place">
      {!data && !error && <Loader label="Gathering your academic picture…" />}
      {error && <ErrorPanel error={error} onRetry={load} />}
      {data && <div className="space-y-8">
        <section id="overview" className="scroll-mt-24">
          <div className="mb-6"><p className="text-sm text-slate-500">Here’s your semester at a glance.</p><h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight">Keep the momentum going.</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Overall attendance" value={`${stats.averageAttendance}%`} detail={stats.averageAttendance < 75 ? "Below required threshold" : "On track this semester"} tone={stats.averageAttendance < 75 ? "coral" : "teal"} icon="✓" />
            <StatCard label="Average grade" value={`${stats.averageGrade}%`} detail={`${data.marks.length} assessments recorded`} tone="blue" icon="↗" />
            <StatCard label="AI risk level" value={data.insight.risk_label} detail={`${data.insight.risk_score}/100 risk score`} tone={data.insight.risk_label === "High" ? "coral" : "amber"} icon="◇" />
            <StatCard label="Active courses" value={data.timetable.length} detail="Current semester" icon="▤" />
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_.8fr]">
          <div className="card" id="academics">
            <SectionHeading eyebrow="Attendance" title="Course consistency">Each bar reflects your semester attendance.</SectionHeading>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.attendance} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#E9EEF3" />
                  <XAxis dataKey="code" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} />
                  <Tooltip cursor={{ fill: "#E8F7F5", opacity: .6 }} formatter={(value) => [`${value}%`, "Attendance"]} contentStyle={{ border: 0, borderRadius: 12, boxShadow: "0 10px 30px #102a431a" }} />
                  <Bar dataKey="percentage" fill="#19A995" radius={[8, 8, 2, 2]} maxBarSize={54} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card overflow-hidden bg-ink text-white">
            <div className="[&_h2]:text-white"><SectionHeading eyebrow="AI insight" title="Your risk signal" /></div>
            <div className="flex items-center gap-6">
              <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full p-2" style={{ background: `conic-gradient(#19A995 ${data.insight.risk_score}%, rgba(255,255,255,.12) 0)` }}>
                <div className="grid h-full w-full place-items-center rounded-full bg-ink text-center"><div><p className="font-display text-2xl font-extrabold">{data.insight.risk_score}</p><p className="text-[10px] uppercase tracking-wider text-slate-400">of 100</p></div></div>
              </div>
              <div><RiskBadge label={data.insight.risk_label} /><p className="mt-3 text-sm leading-6 text-slate-300">This is a support signal, not a final judgment. Small improvements change it quickly.</p></div>
            </div>
            <div className="mt-6 space-y-2">{data.insight.contributing_factors.map((factor) => <div key={factor} className="flex gap-2 rounded-xl bg-white/[.06] p-3 text-xs leading-5 text-slate-200"><span className="text-teal-400">●</span>{factor}</div>)}</div>
          </div>
        </section>

        <section className="card">
          <SectionHeading eyebrow="Performance" title="Recent grades">Scores are normalized by their maximum marks in the overview.</SectionHeading>
          {data.marks.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Course</th><th>Assessment</th><th>Score</th><th>Percentage</th><th>Recorded</th></tr></thead><tbody>{data.marks.map((mark) => <tr key={mark.id}><td><span className="font-bold text-ink">{mark.course.code}</span><span className="ml-2 text-xs text-slate-400">{mark.course.name}</span></td><td>{mark.examType}</td><td>{mark.score} / {mark.maxScore}</td><td><span className="font-bold text-teal-700">{Math.round(mark.score / mark.maxScore * 100)}%</span></td><td>{formatDate(mark.recordedAt)}</td></tr>)}</tbody></table></div> : <EmptyState title="No grades yet" />}
        </section>

        <section id="timetable" className="card scroll-mt-24">
          <SectionHeading eyebrow="Schedule" title="Weekly timetable">Your enrolled courses and rooms.</SectionHeading>
          <div className="grid gap-3 md:grid-cols-3">{data.timetable.map((slot, index) => <div key={slot.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><div className="flex justify-between"><span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-teal-700 shadow-sm">{slot.code}</span><span className="text-xs font-semibold text-slate-400">0{index + 1}</span></div><h3 className="mt-4 font-bold text-ink">{slot.name}</h3><p className="mt-1 text-sm text-slate-500">{slot.day} · {slot.time}</p><p className="mt-3 text-xs font-semibold text-slate-500">{slot.room} · {slot.faculty}</p></div>)}</div>
        </section>

        <section id="notices" className="card scroll-mt-24">
          <SectionHeading eyebrow="Campus updates" title="Notices" />
          <div className="divide-y divide-slate-100">{data.notices.map((notice) => <article key={notice.id} className="py-4 first:pt-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-ink">{notice.title}</h3><span className="text-xs text-slate-400">{formatDate(notice.createdAt)}</span></div><p className="mt-1.5 text-sm leading-6 text-slate-600">{notice.content}</p><p className="mt-2 text-xs font-semibold text-teal-700">Posted by {notice.postedBy.name}</p></article>)}</div>
        </section>
      </div>}
    </DashboardLayout>
  );
}
