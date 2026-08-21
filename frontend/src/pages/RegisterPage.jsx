import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "../components/Logo.jsx";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", department: "Computer Science", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try { await register(form); navigate("/student", { replace: true }); }
    catch (requestError) { setError(requestError.response?.data?.error || "Unable to create account"); }
    finally { setBusy(false); }
  };
  return (
    <div className="min-h-screen bg-canvas px-5 py-10">
      <div className="mx-auto mb-8 max-w-lg"><Logo /></div>
      <div className="card mx-auto max-w-lg p-7 sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-600">Student registration</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold">Join CampusSphere</h1>
        <p className="mt-2 text-sm text-slate-500">Faculty and administrator accounts are provisioned by an administrator.</p>
        <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={submit}>
          <div className="sm:col-span-2"><label className="label">Full name</label><input className="input" name="name" value={form.name} onChange={update} required /></div>
          <div className="sm:col-span-2"><label className="label">Institutional email</label><input className="input" name="email" type="email" value={form.email} onChange={update} required /></div>
          <div><label className="label">Department</label><select className="input" name="department" value={form.department} onChange={update}><option>Computer Science</option><option>Electronics</option><option>Mechanical</option></select></div>
          <div><label className="label">Password</label><input className="input" name="password" type="password" minLength="8" value={form.password} onChange={update} required /></div>
          {error && <p className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <button className="btn-primary sm:col-span-2" disabled={busy}>{busy ? "Creating account…" : "Create student account"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link className="font-bold text-teal-600" to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
