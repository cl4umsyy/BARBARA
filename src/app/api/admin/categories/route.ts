import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// GET /api/admin/categories — list all categories with product count
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id, name, slug, description, image, created_at, products:products(id)")
      .order("name", { ascending: true });

    if (error) throw error;

    const categories = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      imageUrl: c.image ?? null,
      productCount: Array.isArray(c.products) ? c.products.length : 0,
      createdAt: c.created_at,
    }));

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("GET /api/admin/categories error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories — create a new category
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, imageUrl } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const baseSlug = slugify(name.trim());
    let slug = baseSlug;
    let count = 0;

    // Ensure unique slug
    while (true) {
      const { data: existing } = await supabaseAdmin
        .from("categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!existing) break;
      count++;
      slug = `${baseSlug}-${count}`;
    }

    const { data: newCat, error } = await supabaseAdmin
      .from("categories")
      .insert({
        id: crypto.randomUUID(),
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        image: imageUrl || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        description: newCat.description,
        imageUrl: newCat.image,
        productCount: 0,
        createdAt: newCat.created_at,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/categories error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
