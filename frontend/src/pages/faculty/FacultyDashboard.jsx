import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { EmptyState, ErrorPanel, Loader } from "../../components/Feedback.jsx";
import { RiskBadge, SectionHeading, StatCard } from "../../components/Ui.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function FacultyDashboard() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [data, setData] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [date, setDate] = useState(today);
  const [grade, setGrade] = useState({ studentId: "", examType: "Quiz 2", score: "", maxScore: "20" });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/courses").then(({ data: response }) => {
      setCourses(response.courses);
      setCourseId((current) => current || response.courses[0]?.id || "");
    }).catch(setError);
  }, []);

  const load = useCallback(() => {
    if (!courseId) return;
    setData(null); setError(null);
    api.get(`/dashboard/faculty/${courseId}`).then(({ data: response }) => {
      setData(response);
      setStatuses(Object.fromEntries(response.students.map((student) => [student.id, student.latestAttendance])));
      setGrade((current) => ({ ...current, studentId: response.students.some((student) => student.id === current.studentId) ? current.studentId : response.students[0]?.id || "" }));
    }).catch(setError);
  }, [courseId]);
  useEffect(load, [load]);

  const riskCounts = useMemo(() => data?.students.reduce((counts, student) => {
    counts[student.insight.risk_label] += 1; return counts;
  }, { High: 0, Medium: 0, Low: 0 }) || { High: 0, Medium: 0, Low: 0 }, [data]);

  const saveAttendance = async () => {
    setBusy(true); setNotice("");
    try {
      await api.post("/attendance", { courseId, date, records: data.students.map((student) => ({ studentId: student.id, status: statuses[student.id] })) });
      setNotice("Attendance saved for the selected date.");
    } catch (requestError) { setError(requestError); }
    finally { setBusy(false); }
  };

  const saveGrade = async (event) => {
    event.preventDefault(); setBusy(true); setNotice("");
    try {
      await api.post("/marks", { ...grade, courseId, score: Number(grade.score), maxScore: Number(grade.maxScore) });
      setNotice("Grade saved. Existing entries with the same assessment name are updated.");
      setGrade((current) => ({ ...current, score: "" }));
      load();
    } catch (requestError) { setError(requestError); }
    finally { setBusy(false); }
  };

  return (
    <DashboardLayout title="Faculty workspace" subtitle="Teaching tools and early-support signals">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div><label className="label" htmlFor="course">Active course</label><select id="course" className="input min-w-72" value={courseId} onChange={(event) => setCourseId(event.target.value)}>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select></div>
        {notice && <p className="rounded-xl bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700">✓ {notice}</p>}
      </div>
      {!data && !error && <Loader label="Preparing the class workspace…" />}
      {error && !data && <ErrorPanel error={error} onRetry={load} />}
      {data && <div className="space-y-8">
        <section id="overview" className="scroll-mt-24">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Class strength" value={data.students.length} detail={`${data.course.code} enrolled students`} icon="◎" />
            <StatCard label="High risk" value={riskCounts.High} detail="Needs priority follow-up" tone="coral" icon="!" />
            <StatCard label="Medium risk" value={riskCounts.Medium} detail="Worth monitoring" tone="amber" icon="◇" />
            <StatCard label="Stable" value={riskCounts.Low} detail="Low current risk" tone="blue" icon="✓" />
          </div>
        </section>

        <section id="attendance" className="card scroll-mt-24">
          <SectionHeading eyebrow="Class tools" title="Mark attendance" action={<div className="flex gap-2"><input aria-label="Attendance date" type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} /><button className="btn-primary whitespace-nowrap" onClick={saveAttendance} disabled={busy}>Save attendance</button></div>}>Checked students are marked present.</SectionHeading>
          <div className="table-wrap"><table className="data-table"><thead><tr><th className="w-20">Present</th><th>Student</th><th>Department</th><th>AI signal</th></tr></thead><tbody>{data.students.map((student) => <tr key={student.id}><td><label className="relative inline-flex cursor-pointer items-center"><input className="peer sr-only" type="checkbox" checked={statuses[student.id] === "PRESENT"} onChange={(event) => setStatuses({ ...statuses, [student.id]: event.target.checked ? "PRESENT" : "ABSENT" })} /><span className="grid h-7 w-7 place-items-center rounded-lg border-2 border-slate-200 text-transparent transition peer-checked:border-teal-500 peer-checked:bg-teal-500 peer-checked:text-white">✓</span></label></td><td><p className="font-bold text-ink">{student.name}</p><p className="text-xs text-slate-400">{student.email}</p></td><td>{student.department}</td><td><RiskBadge label={student.insight.risk_label} /></td></tr>)}</tbody></table></div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <div id="grades" className="card scroll-mt-24">
            <SectionHeading eyebrow="Assessment" title="Enter or edit a grade">Use the same assessment name to update a score.</SectionHeading>
            <form className="space-y-4" onSubmit={saveGrade}>
              <div><label className="label">Student</label><select className="input" value={grade.studentId} onChange={(event) => setGrade({ ...grade, studentId: event.target.value })}>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></div>
              <div><label className="label">Assessment name</label><input className="input" value={grade.examType} onChange={(event) => setGrade({ ...grade, examType: event.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="label">Score</label><input className="input" type="number" min="0" step="0.1" value={grade.score} onChange={(event) => setGrade({ ...grade, score: event.target.value })} required /></div><div><label className="label">Maximum</label><input className="input" type="number" min="1" step="0.1" value={grade.maxScore} onChange={(event) => setGrade({ ...grade, maxScore: event.target.value })} required /></div></div>
              <button className="btn-primary w-full" disabled={busy || !grade.studentId}>{busy ? "Saving…" : "Save grade"}</button>
            </form>
          </div>

          <div id="insights" className="card scroll-mt-24">
            <SectionHeading eyebrow="Explainable AI" title="Students needing support">Signals combine course attendance, marks trend, and assignment engagement.</SectionHeading>
            <div className="space-y-3">{data.students.filter((student) => student.insight.risk_label !== "Low").sort((a, b) => b.insight.risk_score - a.insight.risk_score).map((student) => <article key={student.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-ink">{student.name}</h3><p className="mt-1 text-xs text-slate-500">Attendance {student.insight.metrics.attendance_percentage}% · Risk score {student.insight.risk_score}/100</p></div><RiskBadge label={student.insight.risk_label} /></div><ul className="mt-3 space-y-1">{student.insight.contributing_factors.map((factor) => <li key={factor} className="flex gap-2 text-xs leading-5 text-slate-600"><span className="text-coral-500">●</span>{factor}</li>)}</ul></article>)}{!data.students.some((student) => student.insight.risk_label !== "Low") && <EmptyState title="No elevated risk signals" detail="The class is currently tracking well." />}</div>
          </div>
        </section>
      </div>}
    </DashboardLayout>
  );
}
