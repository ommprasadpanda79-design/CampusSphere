import { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import Logo from "../components/Logo.jsx";

const navByRole = {
  STUDENT: [["Overview", "overview", "⌂"], ["Academics", "academics", "▤"], ["Timetable", "timetable", "◷"], ["Notices", "notices", "◉"]],
  FACULTY: [["Overview", "overview", "⌂"], ["Attendance", "attendance", "✓"], ["Grades", "grades", "▤"], ["Risk insights", "insights", "◇"]],
  ADMIN: [["Overview", "overview", "⌂"], ["Users", "users", "◎"], ["Notices", "notices", "◉"], ["Analytics", "analytics", "◇"]],
};

export default function DashboardLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = navByRole[user.role];
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("");

  const navigateTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-ink px-4 py-6 text-white transition lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-2"><Logo light /></div>
        <div className="mt-9 rounded-2xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 font-bold">{initials}</span><div className="min-w-0"><p className="truncate text-sm font-bold">{user.name}</p><p className="truncate text-xs text-slate-400">{user.department}</p></div></div>
          <span className="mt-3 inline-block rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-100">{user.role.toLowerCase()}</span>
        </div>
        <nav className="mt-7 space-y-1" aria-label="Dashboard sections">
          {items.map(([label, id, icon], index) => <button key={id} onClick={() => navigateTo(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-white/10 ${index === 0 ? "bg-white/10 text-white" : "text-slate-300"}`}><span className="grid w-5 place-items-center text-base text-teal-400">{icon}</span>{label}</button>)}
        </nav>
        <button onClick={logout} className="absolute bottom-6 left-4 right-4 rounded-xl border border-white/10 px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">↗&nbsp;&nbsp; Sign out</button>
      </aside>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={() => setOpen(false)} />}
      <main className="min-h-screen lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-[78px] items-center justify-between border-b border-slate-200/70 bg-canvas/90 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3"><button className="grid h-10 w-10 place-items-center rounded-xl border bg-white lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">☰</button><div><h1 className="font-display text-xl font-extrabold tracking-tight md:text-2xl">{title}</h1><p className="hidden text-xs text-slate-500 sm:block">{subtitle}</p></div></div>
          <div className="flex items-center gap-2"><span className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 sm:block">Academic year 2025–26</span><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-sm shadow-sm">⌁</span></div>
        </header>
        <div className="mx-auto max-w-[1500px] p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}

