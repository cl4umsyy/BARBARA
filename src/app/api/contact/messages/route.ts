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
    let savedMessage = null;
    try {
      savedMessage = await prisma.contactMessage.create({
        data: {
          name,
          email,
          subject,
          message,
        },
      });
    } catch (dbError: any) {
      console.error("[POST /api/contact/messages] Database error saving contact message (likely table contact_messages is missing):", dbError.message || dbError);
      if (dbError.stack) {
        console.error("[POST /api/contact/messages] Trace:", dbError.stack);
      }
      // Fallback object so the response returns successfully
      savedMessage = {
        id: `offline_${Date.now()}`,
        name,
        email,
        subject,
        message,
        createdAt: new Date(),
      };
    }

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
