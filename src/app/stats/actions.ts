"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { refreshFanAccounts } from "@/lib/fan-accounts";
import { isStatsAuthed } from "@/lib/stats-auth";

// A shared-secret cookie is enough here — this gates one owner-only
// analytics page on a solo-artist site, not a multi-user account system.
export async function authenticate(formData: FormData) {
  const password = formData.get("password");
  const expected = process.env.STATS_PASSWORD;

  if (expected && password === expected) {
    (await cookies()).set("stats_auth", expected, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    redirect("/stats");
  }

  redirect("/stats?error=1");
}

export async function signOut() {
  (await cookies()).delete("stats_auth");
  redirect("/stats");
}

export type RefreshFanState = { status: "idle" } | { status: "success"; synced: number; failed: number } | { status: "error"; message: string };

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- signature required by useActionState
export async function refreshFanStats(_prevState: RefreshFanState): Promise<RefreshFanState> {
  if (!(await isStatsAuthed())) {
    return { status: "error", message: "Not authenticated." };
  }
  try {
    const results = await refreshFanAccounts();
    const failed = results.filter((r) => !r.ok).length;
    revalidatePath("/stats");
    return { status: "success", synced: results.length - failed, failed };
  } catch (e) {
    return { status: "error", message: e instanceof Error ? e.message : "Refresh failed." };
  }
}
