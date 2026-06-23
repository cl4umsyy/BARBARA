import React from "react";
import prisma from "@/lib/prisma";
import { ContactClient } from "@/components/contact/ContactClient";

export const revalidate = 0; // Ensure info updates instantly on sitemap/contact updates

export default async function ContactPage() {
  let contactInfo = null;
  
  try {
    console.log("[Contact Page Server] Querying contact_information table...");
    contactInfo = await prisma.contactInformation.findFirst();
  } catch (error: any) {
    console.error("[Contact Page Server] Database error while fetching contact details:", error.message || error);
    // Log the exact error type and traceback dynamically for developers
    if (error.stack) {
      console.error("[Contact Page Server] Trace:", error.stack);
    }
  }

  const formattedContactInfo = {
    storeName: contactInfo?.storeName || "BARBARA",
    description: contactInfo?.description || "Premium fashion & thrift store. Handpicked quality products for your everyday curated style.",
    address: contactInfo?.address || "Jl. Sunan Kudus No. 100, Kudus, Jawa Tengah 59313, Indonesia",
    whatsapp: contactInfo?.whatsapp || "6281234567890",
    email: contactInfo?.email || "contact@barbarastore.com",
    businessHours: contactInfo?.businessHours || "Senin - Minggu, 09.00 - 21.00 WIB",
    instagramUrl: contactInfo?.instagramUrl || "https://instagram.com/barbara.curated",
    tiktokUrl: contactInfo?.tiktokUrl || "https://tiktok.com/@barbara.curated",
    facebookUrl: contactInfo?.facebookUrl || "https://facebook.com/barbara.curated",
    googleMapsUrl: contactInfo?.googleMapsUrl || "https://maps.app.goo.gl/k5tJ8F2c6y1Q8f3M8",
  };

  return (
    <div className="w-full bg-brand-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-16">
        <ContactClient contactInfo={formattedContactInfo} />
      </div>
    </div>
  );
}
