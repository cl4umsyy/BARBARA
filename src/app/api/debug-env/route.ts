import { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  
  if (secret !== "barbara_migrate_2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const envKeys = Object.keys(process.env);
  const dbUrl = process.env.DATABASE_URL;
  const isSupabaseUrlSet = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Obfuscate the DB URL to hide sensitive password but show host/db details
  let dbUrlObfuscated = "NOT_SET";
  if (dbUrl) {
    try {
      const parsed = new URL(dbUrl);
      dbUrlObfuscated = `${parsed.protocol}//${parsed.username}:***@${parsed.host}${parsed.pathname}`;
    } catch {
      dbUrlObfuscated = dbUrl.substring(0, 15) + "...";
    }
  }

  return NextResponse.json({
    envKeys,
    dbUrlObfuscated,
    isSupabaseUrlSet,
    NODE_ENV: process.env.NODE_ENV,
  });
}
