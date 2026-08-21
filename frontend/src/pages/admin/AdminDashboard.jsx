import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../api/client.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { ErrorPanel, Loader } from "../../components/Feedback.jsx";
import { formatDate, RiskBadge, SectionHeading, StatCard } from "../../components/Ui.jsx";

const emptyUser = { name: "", email: "", department: "Computer Science", role: "STUDENT", password: "" };
const emptyNotice = { title: "", content: "", targetRole: "ALL" };

export default function AdminDashboard() {
  const [users, setUsers] = useState(null);
  const [notices, setNotices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [userForm, setUserForm] = useState(emptyUser);
  const [editingId, setEditingId] = useState(null);
  const [noticeForm, setNoticeForm] = useState(emptyNotice);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [userResponse, noticeResponse, insightResponse] = await Promise.all([
        api.get("/users"), api.get("/notices"), api.get("/insights/college"),
      ]);
      setUsers(userResponse.data.users); setNotices(noticeResponse.data.notices); setAnalytics(insightResponse.data);
    } catch (requestError) { setError(requestError); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => users?.reduce((total, user) => ({ ...total, [user.role]: (total[user.role] || 0) + 1 }), {}) || {}, [users]);
  const elevated = analytics?.insights.filter((item) => item.risk_label !== "Low").length || 0;
  const editUser = (user) => {
    setEditingId(user.id);
    setUserForm({ name: user.name, email: user.email, department: user.department, role: user.role, password: "" });
    document.getElementById("user-form")?.scrollIntoView({ behavior: "smooth" });
  };
  const resetUser = () => { setEditingId(null); setUserForm(emptyUser); };

  const saveUser = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(""); setError(null);
    try {
      const payload = { ...userForm };
      if (editingId && !payload.password) delete payload.password;
      if (editingId) await api.patch(`/users/${editingId}`, payload); else await api.post("/users", payload);
      setMessage(editingId ? "User updated successfully." : "User created successfully.");
      resetUser(); await load();
    } catch (requestError) { setError(requestError); }
    finally { setBusy(false); }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
    setBusy(true); setError(null);
    try { await api.delete(`/users/${user.id}`); setMessage("User deleted."); await load(); }
    catch (requestError) { setError(requestError); }
    finally { setBusy(false); }
  };

  const postNotice = async (event) => {
    event.preventDefault(); setBusy(true); setMessage(""); setError(null);
    try { await api.post("/notices", noticeForm); setNoticeForm(emptyNotice); setMessage("Notice published."); await load(); }
    catch (requestError) { setError(requestError); }
    finally { setBusy(false); }
  };

  const deleteNotice = async (id) => {
    if (!window.confirm("Delete this notice?")) return;
    try { await api.delete(`/notices/${id}`); setMessage("Notice deleted."); await load(); }
    catch (requestError) { setError(requestError); }
  };

  return (
    <DashboardLayout title="Administration" subtitle="People, communication, and institution-wide insight">
      {message && <div className="mb-5 flex justify-between rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700"><span>✓ {message}</span><button onClick={() => setMessage("")}>×</button></div>}
      {!users && !error && <Loader label="Building the college-wide view…" />}
      {error && !users && <ErrorPanel error={error} onRetry={load} />}
      {error && users && <div className="mb-5"><ErrorPanel error={error} /></div>}
      {users && analytics && <div className="space-y-8">
        <section id="overview" className="scroll-mt-24">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Students" value={counts.STUDENT || 0} detail="Active learner accounts" icon="◎" />
            <StatCard label="Faculty" value={counts.FACULTY || 0} detail="Academic staff accounts" tone="blue" icon="▤" />
            <StatCard label="Elevated risk" value={elevated} detail="Medium or high signals" tone="coral" icon="◇" />
            <StatCard label="Departments" value={analytics.departments.length} detail="Represented in analytics" tone="amber" icon="⌂" />
          </div>
        </section>

        <section id="analytics" className="card scroll-mt-24">
          <SectionHeading eyebrow="College-wide AI" title="Risk distribution by department">Counts show current explainable signals across all enrolled students.</SectionHeading>
          <div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.departments} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}><CartesianGrid vertical={false} stroke="#E9EEF3" /><XAxis dataKey="department" axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 11 }} /><Tooltip contentStyle={{ border: 0, borderRadius: 12, boxShadow: "0 10px 30px #102a431a" }} /><Legend iconType="circle" /><Bar dataKey="low" name="Low" stackId="risk" fill="#19A995" radius={[0, 0, 4, 4]} /><Bar dataKey="medium" name="Medium" stackId="risk" fill="#F5B942" /><Bar dataKey="high" name="High" stackId="risk" fill="#F46F5E" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">{analytics.departments.map((department) => <div key={department.department} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-bold text-slate-500">{department.department}</p><p className="mt-1 font-display text-2xl font-bold">{department.averageRisk}<span className="text-xs font-medium text-slate-400"> / 100 avg.</span></p></div>)}</div>
        </section>

        <section id="users" className="grid scroll-mt-24 gap-6 xl:grid-cols-[.72fr_1.28fr]">
          <div className="card" id="user-form">
            <SectionHeading eyebrow="Access control" title={editingId ? "Edit user" : "Add a user"}>{editingId ? "Leave password blank to keep it unchanged." : "Create a student, faculty, or admin account."}</SectionHeading>
            <form className="space-y-4" onSubmit={saveUser}>
              <div><label className="label">Full name</label><input className="input" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="label">Role</label><select className="input" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}><option>STUDENT</option><option>FACULTY</option><option>ADMIN</option></select></div><div><label className="label">Department</label><input className="input" value={userForm.department} onChange={(event) => setUserForm({ ...userForm, department: event.target.value })} required /></div></div>
              <div><label className="label">{editingId ? "New password (optional)" : "Temporary password"}</label><input className="input" type="password" minLength="8" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required={!editingId} /></div>
              <div className="flex gap-2"><button className="btn-primary flex-1" disabled={busy}>{busy ? "Saving…" : editingId ? "Update user" : "Create user"}</button>{editingId && <button type="button" className="btn-secondary" onClick={resetUser}>Cancel</button>}</div>
            </form>
          </div>
          <div className="card min-w-0">
            <SectionHeading eyebrow="Directory" title="User management"><span className="font-semibold text-ink">{users.length}</span> accounts across all roles.</SectionHeading>
            <div className="table-wrap max-h-[520px] overflow-auto"><table className="data-table"><thead className="sticky top-0"><tr><th>User</th><th>Role</th><th>Department</th><th className="text-right">Actions</th></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><p className="font-bold text-ink">{user.name}</p><p className="text-xs text-slate-400">{user.email}</p></td><td><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : user.role === "FACULTY" ? "bg-blue-100 text-blue-700" : "bg-teal-100 text-teal-700"}`}>{user.role}</span></td><td>{user.department}</td><td><div className="flex justify-end gap-2"><button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => editUser(user)}>Edit</button><button className="btn-danger" onClick={() => deleteUser(user)}>Delete</button></div></td></tr>)}</tbody></table></div>
          </div>
        </section>

        <section id="notices" className="grid scroll-mt-24 gap-6 xl:grid-cols-[.72fr_1.28fr]">
          <div className="card">
            <SectionHeading eyebrow="Communication" title="Compose notice">Publish to the whole campus or a specific role.</SectionHeading>
            <form className="space-y-4" onSubmit={postNotice}>
              <div><label className="label">Title</label><input className="input" value={noticeForm.title} onChange={(event) => setNoticeForm({ ...noticeForm, title: event.target.value })} required /></div>
              <div><label className="label">Audience</label><select className="input" value={noticeForm.targetRole} onChange={(event) => setNoticeForm({ ...noticeForm, targetRole: event.target.value })}><option value="ALL">Everyone</option><option value="STUDENT">Students</option><option value="FACULTY">Faculty</option><option value="ADMIN">Administrators</option></select></div>
              <div><label className="label">Message</label><textarea className="input min-h-32 resize-y" value={noticeForm.content} onChange={(event) => setNoticeForm({ ...noticeForm, content: event.target.value })} required /></div>
              <button className="btn-primary w-full" disabled={busy}>{busy ? "Publishing…" : "Publish notice"}</button>
            </form>
          </div>
          <div className="card">
            <SectionHeading eyebrow="Published" title="Recent notices" />
            <div className="max-h-[500px] space-y-3 overflow-auto pr-1">{notices.map((notice) => <article key={notice.id} className="rounded-2xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-ink">{notice.title}</h3><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">{notice.targetRole}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{notice.content}</p><p className="mt-2 text-xs text-slate-400">{formatDate(notice.createdAt)} · {notice.postedBy.name}</p></div><button className="btn-danger shrink-0" onClick={() => deleteNotice(notice.id)}>Delete</button></div></article>)}</div>
          </div>
        </section>

        <section className="card">
          <SectionHeading eyebrow="Priority list" title="Elevated student signals">This list supports outreach decisions; it should not be used as an automated academic judgment.</SectionHeading>
          <div className="table-wrap"><table className="data-table"><thead><tr><th>Student</th><th>Department</th><th>Risk</th><th>Score</th><th>Primary factor</th></tr></thead><tbody>{analytics.insights.filter((student) => student.risk_label !== "Low").sort((a, b) => b.risk_score - a.risk_score).map((student) => <tr key={student.id}><td className="font-bold text-ink">{student.name}</td><td>{student.department}</td><td><RiskBadge label={student.risk_label} /></td><td className="font-bold">{student.risk_score}</td><td className="max-w-sm text-xs">{student.contributing_factors[0]}</td></tr>)}</tbody></table></div>
        </section>
      </div>}
    </DashboardLayout>
  );
}
