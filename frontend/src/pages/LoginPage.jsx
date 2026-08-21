import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "../components/Logo.jsx";

const demos = [
  ["Student", "student1@campussphere.edu"],
  ["Faculty", "maya.iyer@campussphere.edu"],
  ["Admin", "admin@campussphere.edu"],
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "student1@campussphere.edu", password: "Demo@123" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;

  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const loggedIn = await login(form);
      const requested = location.state?.from?.pathname;
      navigate(requested || `/${loggedIn.role.toLowerCase()}`, { replace: true });
    } catch (requestError) { setError(requestError.response?.data?.error || "Unable to sign in"); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-36 -top-36 h-[430px] w-[430px] rounded-full border-[90px] border-teal-500/10" />
        <div className="absolute -bottom-44 left-20 h-[500px] w-[500px] rounded-full border-[100px] border-white/[.035]" />
        <Logo light />
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[.28em] text-teal-400">One campus. One intelligent view.</p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.08] tracking-tight xl:text-6xl">Help every student find their path forward.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">Campus operations, academic progress, and explainable risk signals—brought together for students, faculty, and administrators.</p>
        </div>
        <div className="relative grid grid-cols-3 gap-3">
          {[['20+', 'student profiles'], ['3', 'role experiences'], ['24×7', 'live insights']].map(([value, label]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-4"><p className="font-display text-2xl font-bold text-teal-400">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>)}
        </div>
      </section>
      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-md animate-float-in">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-teal-600">Welcome back</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight">Sign in to your campus</h2>
          <p className="mt-2 text-sm text-slate-500">Use your institutional account to continue.</p>
          <form className="mt-8 space-y-5" onSubmit={submit}>
            <div><label className="label" htmlFor="email">Email address</label><input className="input" id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div><div className="flex justify-between"><label className="label" htmlFor="password">Password</label><span className="text-xs font-semibold text-teal-600">Secure campus login</span></div><input className="input" id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div>
            {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">{error}</p>}
            <button className="btn-primary w-full py-3" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
          </form>
          <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-slate-200" /><span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Demo accounts</span><span className="h-px flex-1 bg-slate-200" /></div>
          <div className="grid grid-cols-3 gap-2">{demos.map(([role, email]) => <button key={role} className="rounded-xl border border-slate-200 px-2 py-2.5 text-xs font-bold text-slate-600 transition hover:border-teal-300 hover:bg-teal-50" onClick={() => setForm({ email, password: "Demo@123" })}>{role}</button>)}</div>
          <p className="mt-8 text-center text-sm text-slate-500">New student? <Link className="font-bold text-teal-600 hover:text-teal-700" to="/register">Create an account</Link></p>
        </div>
      </section>
    </div>
  );
}

