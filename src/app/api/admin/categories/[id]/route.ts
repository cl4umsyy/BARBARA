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

// PATCH /api/admin/categories/[id] — update a category
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, imageUrl } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const newSlug = slugify(name.trim());

    // Check slug uniqueness (excluding current category)
    const { data: existing } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", newSlug)
      .neq("id", id)
      .maybeSingle();

    let slug = newSlug;
    if (existing) {
      slug = `${newSlug}-${Date.now()}`;
    }

    const { data: updated, error } = await supabaseAdmin
      .from("categories")
      .update({
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        image: imageUrl || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      imageUrl: updated.image,
      createdAt: updated.created_at,
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] — delete a category (blocks if has products)
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if category has products
    const { count, error: countErr } = await supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (countErr) throw countErr;

    if (count && count > 0) {
      return NextResponse.json(
        {
          error: `Kategori tidak dapat dihapus karena masih memiliki ${count} produk. Pindahkan atau hapus produk terlebih dahulu.`,
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/admin/categories/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
