import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin, isMissingColumnError } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // 1. Try to get default address
    let addressResult = await supabaseAdmin
      .from("addresses")
      .select("id, label, recipient_name, phone, street, city, province, district, postal_code, address_detail, is_default, created_at")
      .eq("user_id", userId)
      .eq("is_default", true)
      .maybeSingle();

    let dbAddress: any = addressResult.data;
    let error = addressResult.error;

    // 2. Handle missing column error / schema cache issues
    if (error && isMissingColumnError(error)) {
      const fallbackResult = await supabaseAdmin
        .from("addresses")
        .select("id, label, recipient_name, phone, street, city, province, postal_code, is_default")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle();

      if (fallbackResult.error) {
        error = fallbackResult.error;
      } else {
        dbAddress = fallbackResult.data;
        error = null;
      }
    }

    // 3. If no default address, try to fall back to the first address
    if (!error && !dbAddress) {
      let fallbackListResult = await supabaseAdmin
        .from("addresses")
        .select("id, label, recipient_name, phone, street, city, province, district, postal_code, address_detail, is_default, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackListResult.error && isMissingColumnError(fallbackListResult.error)) {
        fallbackListResult = await supabaseAdmin
          .from("addresses")
          .select("id, label, recipient_name, phone, street, city, province, postal_code, is_default")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
      }

      dbAddress = fallbackListResult.data;
      error = fallbackListResult.error;
    }

    if (error) throw error;

    if (!dbAddress) {
      return NextResponse.json({ address: null });
    }

    // Map properties to camelCase for the frontend
    let district = dbAddress.district || "";
    let city = dbAddress.city;
    if (dbAddress.city && dbAddress.city.includes(" | ")) {
      const parts = dbAddress.city.split(" | ");
      district = parts[0];
      city = parts[1];
    }

    const mappedAddress = {
      id: dbAddress.id,
      label: dbAddress.label || "Alamat",
      recipientName: dbAddress.recipient_name,
      phone: dbAddress.phone,
      street: dbAddress.street,
      city: city,
      province: dbAddress.province,
      district: district,
      postalCode: dbAddress.postal_code,
      addressDetail: dbAddress.address_detail || dbAddress.street,
      isDefault: dbAddress.is_default || false,
      createdAt: dbAddress.created_at || new Date().toISOString(),
    };

    return NextResponse.json({ address: mappedAddress });
  } catch (error: any) {
    console.error("[Default Address GET API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal mengambil alamat utama" },
      { status: 500 }
    );
  }
}
