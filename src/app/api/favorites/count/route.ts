import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET /api/favorites/count — get favorite count for the logged-in user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const { count, error } = await supabaseAdmin
      .from("wishlists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ count: count ?? 0 });
  } catch (error: any) {
    console.error("GET /api/favorites/count error:", error);
    return NextResponse.json({ count: 0 });
  }
}
