import { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  // Static routes
  const routes = ["", "/shop", "/about", "/contact"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  // Dynamic products
  let productUrls: any[] = [];
  try {
    const { data: products } = await supabaseAdmin
      .from("products")
      .select("slug, created_at")
      .eq("is_active", true);

    if (products) {
      productUrls = products.map((product) => ({
        url: `${baseUrl}/shop/${product.slug}`,
        lastModified: new Date(product.created_at),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error("Sitemap dynamic product fetch error:", error);
  }

  return [...routes, ...productUrls];
}
