import React from "react";
import prisma from "@/lib/prisma";
import { ContactClient } from "@/components/contact/ContactClient";

export const revalidate = 0; // Ensure info updates instantly on sitemap/contact updates

export default async function ContactPage() {
  let contactInfo = await prisma.contactInformation.findFirst();

  if (!contactInfo) {
    contactInfo = {
      id: "contact_info_default",
      storeName: "BARBARA",
      description: "Premium fashion & thrift store. Handpicked quality products for your everyday curated style.",
      address: "Jl. Sunan Kudus No. 100, Kudus, Jawa Tengah 59313, Indonesia",
      whatsapp: "6281234567890",
      email: "contact@barbarastore.com",
      businessHours: "Senin - Minggu, 09.00 - 21.00 WIB",
      instagramUrl: "https://instagram.com/barbara.curated",
      tiktokUrl: "https://tiktok.com/@barbara.curated",
      facebookUrl: "https://facebook.com/barbara.curated",
      googleMapsUrl: "https://maps.app.goo.gl/k5tJ8F2c6y1Q8f3M8",
      updatedAt: new Date(),
    };
  }

  const formattedContactInfo = {
    storeName: contactInfo.storeName,
    description: contactInfo.description,
    address: contactInfo.address,
    whatsapp: contactInfo.whatsapp,
    email: contactInfo.email,
    businessHours: contactInfo.businessHours,
    instagramUrl: contactInfo.instagramUrl,
    tiktokUrl: contactInfo.tiktokUrl,
    facebookUrl: contactInfo.facebookUrl,
    googleMapsUrl: contactInfo.googleMapsUrl,
  };

  return (
    <div className="w-full bg-brand-white">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8 lg:px-16">
        <ContactClient contactInfo={formattedContactInfo} />
      </div>
    </div>
  );
}
