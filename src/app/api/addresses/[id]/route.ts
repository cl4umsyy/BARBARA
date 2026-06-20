import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

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

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
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

    // Check if the address exists and belongs to the user
    const { data: existingAddress, error: findError } = await supabaseAdmin
      .from("addresses")
      .select("id, is_default")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (findError || !existingAddress) {
      return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
    }

    let setAsDefault = data.isDefault;

    // If trying to set isDefault to false on an address that is currently default
    if (!setAsDefault && existingAddress.is_default) {
      // Find if there are other addresses to fall back to
      const { data: otherAddresses } = await supabaseAdmin
        .from("addresses")
        .select("id")
        .eq("user_id", userId)
        .neq("id", id);

      if (otherAddresses && otherAddresses.length > 0) {
        return NextResponse.json(
          { error: "Minimal harus memiliki satu alamat utama. Silakan jadikan alamat lain sebagai alamat utama terlebih dahulu." },
          { status: 400 }
        );
      } else {
        // If it is the only address, it must stay default
        setAsDefault = true;
      }
    }

    // If setting as default, unset default flag on all other addresses first
    if (setAsDefault) {
      await supabaseAdmin
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", userId);
    }

    let updateResult = await supabaseAdmin
      .from("addresses")
      .update({
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
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    let updatedAddr = updateResult.data;
    let updateError = updateResult.error;

    if (updateError && updateError.code === "42703") {
      const fallbackResult = await supabaseAdmin
        .from("addresses")
        .update({
          label: data.label.trim(),
          recipient_name: data.recipientName.trim(),
          phone: data.phone.trim(),
          street: data.addressDetail.trim(),
          city: `${data.district.trim()} | ${data.city.trim()}`,
          province: data.province.trim(),
          postal_code: data.postalCode.trim(),
          is_default: setAsDefault,
        })
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (fallbackResult.error) {
        updateError = fallbackResult.error;
      } else {
        updatedAddr = fallbackResult.data ? {
          ...fallbackResult.data,
          district: data.district.trim(),
          city: data.city.trim(),
          address_detail: data.addressDetail.trim(),
          created_at: new Date().toISOString(),
        } : null;
        updateError = null;
      }
    }

    if (updateError || !updatedAddr) throw updateError || new Error("Gagal memperbarui");

    return NextResponse.json({
      message: "Alamat berhasil diperbarui",
      address: {
        id: updatedAddr.id,
        label: updatedAddr.label,
        recipientName: updatedAddr.recipient_name,
        phone: updatedAddr.phone,
        street: updatedAddr.street,
        city: updatedAddr.city,
        province: updatedAddr.province,
        district: updatedAddr.district || "",
        postalCode: updatedAddr.postal_code,
        addressDetail: updatedAddr.address_detail,
        isDefault: updatedAddr.is_default,
        createdAt: updatedAddr.created_at,
      },
    });
  } catch (error: any) {
    console.error("[Address PUT API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal memperbarui alamat" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if the address exists and belongs to the user
    const { data: existingAddress, error: findError } = await supabaseAdmin
      .from("addresses")
      .select("id, is_default")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (findError || !existingAddress) {
      return NextResponse.json({ error: "Alamat tidak ditemukan" }, { status: 404 });
    }

    // If deleting the default address, look for another one to make default
    if (existingAddress.is_default) {
      const otherAddressesResult = await supabaseAdmin
        .from("addresses")
        .select("id")
        .eq("user_id", userId)
        .neq("id", id)
        .order("created_at", { ascending: false });

      let otherAddresses = otherAddressesResult.data;
      if (otherAddressesResult.error && otherAddressesResult.error.code === "42703") {
        const fallbackResult = await supabaseAdmin
          .from("addresses")
          .select("id")
          .eq("user_id", userId)
          .neq("id", id);
        
        if (fallbackResult.data) {
          otherAddresses = fallbackResult.data;
        }
      }

      if (otherAddresses && otherAddresses.length > 0) {
        // Promote the latest address to default
        const newDefaultId = otherAddresses[0].id;
        await supabaseAdmin
          .from("addresses")
          .update({ is_default: true })
          .eq("id", newDefaultId);
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: "Alamat berhasil dihapus" });
  } catch (error: any) {
    console.error("[Address DELETE API] Error:", error?.message);
    return NextResponse.json(
      { error: "Gagal menghapus alamat" },
      { status: 500 }
    );
  }
}
