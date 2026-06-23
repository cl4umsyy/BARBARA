import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendAdminContactNotification } from "@/lib/mail";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    // Simple validation
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Semua kolom input (Nama, Email, Subjek, Pesan) wajib diisi." },
        { status: 400 }
      );
    }

    // Save to PostgreSQL database
    const savedMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    // Send email notification to admin (gracefully catch errors so API still succeeds if SMTP is offline)
    try {
      await sendAdminContactNotification({
        name,
        email,
        subject,
        message,
      });
    } catch (mailError) {
      console.error("Email notification failed to send:", mailError);
    }

    return NextResponse.json({
      success: true,
      message: "Pesan Anda berhasil dikirim.",
      data: savedMessage,
    });
  } catch (error: any) {
    console.error("POST /api/contact/messages error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
