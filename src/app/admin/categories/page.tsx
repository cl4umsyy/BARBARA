import { supabaseAdmin } from "@/lib/supabase";
import { CategoriesClient } from "@/components/admin/CategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  let categories: any[] = [];

  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id, name, slug, description, image, created_at, products:products(id)")
      .order("name", { ascending: true });

    if (error) throw error;

    categories = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description ?? null,
      imageUrl: c.image ?? null,
      productCount: Array.isArray(c.products) ? c.products.length : 0,
      createdAt: c.created_at,
    }));
  } catch (err) {
    console.error("Failed to load categories:", err);
  }

  return <CategoriesClient initialCategories={categories} />;
}
