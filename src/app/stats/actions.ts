"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
