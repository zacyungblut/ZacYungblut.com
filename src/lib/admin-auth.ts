import "server-only";
import { cookies } from "next/headers";

export async function isAdminAuthed(): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  const cookieStore = await cookies();
  return Boolean(expected) && cookieStore.get("admin_auth")?.value === expected;
}
