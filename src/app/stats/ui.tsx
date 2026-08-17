export const th = "px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-[#82806F]";
export const td = "px-3 py-2 text-sm text-[#F3ECDD] whitespace-nowrap";
export const tdMuted = "px-3 py-2 text-sm text-[#B9B6A6] whitespace-nowrap";

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-[#82806F]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#F3ECDD]">{value}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#FF9100]">{title}</h2>
      {children}
    </div>
  );
}
