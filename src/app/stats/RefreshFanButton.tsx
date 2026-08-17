"use client";

import { useActionState } from "react";
import { refreshFanStats, type RefreshFanState } from "./actions";

const initialState: RefreshFanState = { status: "idle" };

export function RefreshFanButton() {
  const [state, formAction, isPending] = useActionState(refreshFanStats, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#F3ECDD] transition-colors hover:border-[#FF9100] disabled:opacity-50"
      >
        {isPending ? "Refreshing…" : "Refresh stats"}
      </button>
      {state.status === "success" ? (
        <span className="text-xs text-[#7FA06F]">
          {state.synced} account{state.synced === 1 ? "" : "s"} synced
          {state.failed > 0 ? `, ${state.failed} failed` : ""}
        </span>
      ) : null}
      {state.status === "error" ? <span className="text-xs text-[#E5484D]">{state.message}</span> : null}
    </form>
  );
}
