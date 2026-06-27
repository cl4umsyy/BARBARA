import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin, isMissingColumnError } from "@/lib/supabase";
import { z } from "zod";

export const dynamic = "force-dynamic";

const AddressSchema = z.object({
  label: z.string().min(1, "Label alamat wajib diisi (misal: Rumah, Kantor)"),
  recipientName: z.string().min(1, "Nama penerima wajib diisi"),
  phone: z.string().min(8, "Nomor telepon minimal 8 angka").max(15, "Nomor telepon maksimal 15 angka"),
  province: z.string().min(1, "Provinsi wajib diisi"),
  city: z.string().min(1, "Kota wajib diisi"),
  district: z.string().min(1, "Kecamatan wajib diisi"),
  postalCode: z.string().min(3, "Kode pos minimal 3 digit"),
  addressDetail: z.string().min(1, "Detail alamat/jalan wajib diisi"),
  isDefault: z.boolean().default(false),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let addressResult = await supabaseAdmin
      .from("addresses")
      .select("id, label, recipient_name, phone, street, city, province, district, postal_code, is_default, created_at")
      .eq("user_id", session.user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    let dbAddresses = addressResult.data;
    let error = addressResult.error;

    if (error && isMissingColumnError(error)) {
      const fallbackResult = await supabaseAdmin
        .from("addresses")
        .select("id, label, recipient_name, phone, street, city, province, postal_code, is_default")
        .eq("user_id", session.user.id)
        .order("is_default", { ascending: false });

      if (fallbackResult.error) {
        error = fallbackResult.error;
      } else {
        dbAddresses = (fallbackResult.data || []).map((addr: any) => {
          let district = "";
          let city = addr.city;
          if (addr.city && addr.city.includes(" | ")) {
            const parts = addr.city.split(" | ");
            district = parts[0];
            city = parts[1];
          }
          return {
            id: addr.id,
            label: addr.label,
            recipient_name: addr.recipient_name,
            phone: addr.phone,
            street: addr.street,
            city,
            province: addr.province,
            district,
            postal_code: addr.postal_code,
            address_detail: addr.street,
            is_default: addr.is_default,
            created_at: new Date().toISOString(),
          };
        });
        error = null;
      }
    }

    if (error) throw error;

    const addresses = (dbAddresses || []).map((addr: any) => ({
      id: addr.id,
      label: addr.label,
      recipientName: addr.recipient_name,
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      province: addr.province,
      district: addr.district || "",
      postalCode: addr.postal_code,
      addressDetail: addr.address_detail || addr.street, // Fallback to street
      isDefault: addr.is_default,
      createdAt: addr.created_at,
    }));

    return NextResponse.json({ addresses });
  } catch (error: any) {
    console.error("[Addresses GET API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal mengambil daftar alamat" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validation = AddressSchema.safeParse(body);
    if (!validation.success) {
      const errorMsg = validation.error.issues[0]?.message || "Input tidak valid";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const data = validation.data;
    const userId = session.user.id;

    // Check if this is the first address, automatically make it default
    const { count } = await supabaseAdmin
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    const hasNoAddresses = count === 0;
    const setAsDefault = data.isDefault || hasNoAddresses;

    // If setting as default, unset default flag on all other addresses first
    if (setAsDefault) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    const addressId = crypto.randomUUID();

    let insertResult = await supabaseAdmin
      .from("addresses")
      .insert({
        id: addressId,
        user_id: userId,
        label: data.label.trim(),
        recipient_name: data.recipientName.trim(),
        phone: data.phone.trim(),
        street: data.addressDetail.trim(), // Keep street aligned with legacy schema
        city: data.city.trim(),
        province: data.province.trim(),
        district: data.district.trim(),
        postal_code: data.postalCode.trim(),
        address_detail: data.addressDetail.trim(),
        is_default: setAsDefault,
      })
      .select()
      .single();

    let error = insertResult.error;
    let newAddr = insertResult.data;

    if (error && isMissingColumnError(error)) {
      const fallbackResult = await supabaseAdmin
        .from("addresses")
        .insert({
          id: addressId,
          user_id: userId,
          label: data.label.trim(),
          recipient_name: data.recipientName.trim(),
          phone: data.phone.trim(),
          street: data.addressDetail.trim(),
          city: `${data.district.trim()} | ${data.city.trim()}`,
          province: data.province.trim(),
          postal_code: data.postalCode.trim(),
          is_default: setAsDefault,
        })
        .select()
        .single();

      if (fallbackResult.error) {
        error = fallbackResult.error;
      } else {
        newAddr = fallbackResult.data ? {
          ...fallbackResult.data,
          district: data.district.trim(),
          city: data.city.trim(),
          address_detail: data.addressDetail.trim(),
          created_at: new Date().toISOString(),
        } : null;
        error = null;
      }
    }

    if (error || !newAddr) throw error || new Error("Gagal menyimpan alamat");

    return NextResponse.json({
      message: "Alamat berhasil ditambahkan",
      address: {
        id: newAddr.id,
        label: newAddr.label,
        recipientName: newAddr.recipient_name,
        phone: newAddr.phone,
        street: newAddr.street,
        city: newAddr.city,
        province: newAddr.province,
        district: newAddr.district || "",
        postalCode: newAddr.postal_code,
        addressDetail: newAddr.address_detail,
        isDefault: newAddr.is_default,
        createdAt: newAddr.created_at,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("[Addresses POST API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal menambahkan alamat" },
      { status: 500 }
    );
  }
}
