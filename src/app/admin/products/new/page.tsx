import { supabaseAdmin } from "@/lib/supabase";
import { ProductFormClient } from "@/components/admin/ProductFormClient";

export default async function AdminNewProductPage() {
  let categories: any[] = [];

  try {
    const { data: dbCategories, error } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw error;
    categories = dbCategories || [];
  } catch (error) {
    console.error("Failed to load categories for product form:", error);
    // Fallback Mock Categories
    categories = [
      { id: "cat1", name: "T-Shirts" },
      { id: "cat2", name: "Jackets" },
      { id: "cat3", name: "Pants" },
    ];
  }

  return <ProductFormClient categories={categories} />;
}
