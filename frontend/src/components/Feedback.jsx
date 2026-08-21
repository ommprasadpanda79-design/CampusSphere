export function FullPageLoader() {
  return <div className="grid min-h-screen place-items-center bg-canvas"><Loader label="Opening your campus…" /></div>;
}

export function Loader({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm font-medium text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
      {label}
    </div>
  );
}

export function ErrorPanel({ error, onRetry }) {
  const message = error?.response?.data?.error || error?.message || "Something went wrong";
  return (
    <div className="card mx-auto max-w-xl border-red-100 bg-red-50 text-center">
      <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-red-100 font-bold text-red-600">!</div>
      <p className="font-semibold text-red-800">{message}</p>
      {onRetry && <button className="btn-secondary mt-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, detail }) {
  return <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center"><p className="font-semibold text-slate-700">{title}</p>{detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}</div>;
}

