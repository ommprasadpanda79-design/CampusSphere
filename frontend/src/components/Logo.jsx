export default function Logo({ light = false, compact = false }) {
  return (
    <div className="flex items-center gap-3" aria-label="CampusSphere">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-500 shadow-lg shadow-teal-900/20">
        <span className="h-4 w-4 rounded-full border-[3px] border-white" />
        <span className="absolute h-7 w-7 rotate-45 rounded-full border border-white/55" />
      </div>
      {!compact && <span className={`font-display text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>Campus<span className="text-teal-500">Sphere</span></span>}
    </div>
  );
}

