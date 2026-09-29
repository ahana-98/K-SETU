import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSessionFromHeaders, roleHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSessionFromHeaders(await headers());
  redirect(session ? roleHome(session.role) : "/login");
}
