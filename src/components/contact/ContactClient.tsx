"use client";

import React, { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, MessageSquare } from "lucide-react";

interface ContactInfo {
  storeName: string;
  description: string;
  address: string;
  whatsapp: string;
  email: string;
  businessHours: string;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  facebookUrl?: string | null;
  googleMapsUrl?: string | null;
}

interface ContactClientProps {
  contactInfo: ContactInfo;
}

export const ContactClient: React.FC<ContactClientProps> = ({ contactInfo }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Pesan Anda berhasil dikirim! Kami akan menghubungi Anda segera.");
        setFormData({ name: "", email: "", subject: "", message: "" });
      } else {
        setErrorMsg(data.error || "Gagal mengirim pesan. Silakan coba lagi.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Koneksi bermasalah. Silakan periksa jaringan Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-brand-white pb-20">
      {/* Title Header */}
      <div className="border-b border-brand-light pb-6 mb-12">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">
          Hubungi Kami
        </p>
        <h1 className="text-3xl md:text-5xl font-black tracking-widest text-brand-black mt-1 uppercase">
          KONTAK
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Left Column: Business Details */}
        <div className="flex flex-col gap-8">
          <div className="bg-brand-white border border-brand-light/35 p-8 rounded-3xl shadow-sm flex flex-col gap-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-brand-black mb-2">
                {contactInfo.storeName}
              </h2>
              <p className="text-sm text-brand-gray-light font-medium leading-relaxed">
                {contactInfo.description}
              </p>
            </div>

            <div className="h-px bg-brand-light/45 my-2" />

            {/* Info Items */}
            <div className="flex flex-col gap-5">
              
              {/* Address */}
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-brand-light flex items-center justify-center rounded-xl text-brand-black">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Alamat</p>
                  <p className="text-sm font-bold text-brand-black mt-0.5 leading-relaxed">{contactInfo.address}</p>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-brand-light flex items-center justify-center rounded-xl text-brand-black">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">WhatsApp</p>
                  <a 
                    href={`https://wa.me/${contactInfo.whatsapp}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-brand-black mt-0.5 hover:underline block"
                  >
                    +{contactInfo.whatsapp}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-brand-light flex items-center justify-center rounded-xl text-brand-black">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Email</p>
                  <a 
                    href={`mailto:${contactInfo.email}`}
                    className="text-sm font-bold text-brand-black mt-0.5 hover:underline block"
                  >
                    {contactInfo.email}
                  </a>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-brand-light flex items-center justify-center rounded-xl text-brand-black">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">Jam Operasional</p>
                  <p className="text-sm font-bold text-brand-black mt-0.5">{contactInfo.businessHours}</p>
                </div>
              </div>

            </div>

            <div className="h-px bg-brand-light/45 my-2" />

            {/* Social Media Links */}
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-gray-light">Ikuti Kami:</span>
              
              {contactInfo.instagramUrl && (
                <a href={contactInfo.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-brand-light hover:bg-brand-black hover:text-brand-white text-brand-black rounded-xl transition-all" aria-label="Instagram">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              )}

              {contactInfo.tiktokUrl && (
                <a href={contactInfo.tiktokUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-brand-light hover:bg-brand-black hover:text-brand-white text-brand-black rounded-xl transition-all" aria-label="TikTok">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.99-.86-1.68-2.07-2.02-3.32v12.51c-.04 2.97-1.47 5.97-4.27 7.02-2.92 1.11-6.47.53-8.82-1.57-2.47-2.18-3.41-6.05-2.04-9.01 1.23-2.73 4.22-4.63 7.23-4.62.18 0 .37 0 .55.02v4.07c-1.22-.16-2.52.17-3.46.99-1.04.91-1.39 2.53-.88 3.84.5 1.34 2 2.22 3.44 2.06 1.48-.12 2.74-1.37 2.8-2.88.02-3.13.01-6.26.01-9.38-.01-1.38-.01-2.77-.01-4.15z"/></svg>
                </a>
              )}

              {contactInfo.facebookUrl && (
                <a href={contactInfo.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-brand-light hover:bg-brand-black hover:text-brand-white text-brand-black rounded-xl transition-all" aria-label="Facebook">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
                </a>
              )}

            </div>
          </div>

          {/* Quick Action Buttons Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* WhatsApp CTA */}
            <a 
              href={`https://wa.me/${contactInfo.whatsapp}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-4 bg-[#25D366] text-white text-xs font-black uppercase tracking-wider rounded-2xl hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              WhatsApp
            </a>

            {/* Email CTA */}
            <a 
              href={`mailto:${contactInfo.email}`}
              className="flex items-center justify-center gap-2 py-4 bg-brand-black text-brand-white text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-brand-black/90 transition-colors shadow-sm cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Kirim Email
            </a>

            {/* Google Maps CTA */}
            {contactInfo.googleMapsUrl && (
              <a 
                href={contactInfo.googleMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-4 bg-transparent border border-brand-black text-brand-black text-xs font-black uppercase tracking-wider rounded-2xl hover:bg-brand-light/35 transition-colors shadow-sm cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                Google Maps
              </a>
            )}

          </div>
        </div>

        {/* Right Column: Inquiries Message Form */}
        <div className="bg-brand-white border border-brand-light/35 p-8 rounded-3xl shadow-sm">
          <h2 className="text-xl font-black uppercase tracking-wider text-brand-black mb-2">
            Kirim Pesan
          </h2>
          <p className="text-xs text-brand-gray-light font-bold uppercase tracking-wider mb-6">
            Ada pertanyaan? Hubungi kami langsung melalui form di bawah
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            {/* Alert Messages */}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-xl p-4 leading-relaxed">
                {successMsg}
              </div>
            )}
            
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl p-4 leading-relaxed">
                {errorMsg}
              </div>
            )}

            {/* Name Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                Nama Lengkap
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama Anda"
                className="w-full text-xs font-bold uppercase tracking-wider px-4 py-3.5 border border-brand-light/60 bg-brand-white rounded-xl focus:border-brand-black outline-none transition-colors"
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                Alamat Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full text-xs font-bold px-4 py-3.5 border border-brand-light/60 bg-brand-white rounded-xl focus:border-brand-black outline-none transition-colors"
              />
            </div>

            {/* Subject Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="subject" className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                Subjek
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="Subjek pesan"
                className="w-full text-xs font-bold uppercase tracking-wider px-4 py-3.5 border border-brand-light/60 bg-brand-white rounded-xl focus:border-brand-black outline-none transition-colors"
              />
            </div>

            {/* Message Input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="message" className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                Pesan Anda
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={formData.message}
                onChange={handleChange}
                placeholder="Tuliskan pesan Anda di sini..."
                className="w-full text-xs font-bold px-4 py-3.5 border border-brand-light/60 bg-brand-white rounded-xl focus:border-brand-black outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-4 bg-brand-black text-brand-white text-xs font-black uppercase tracking-widest hover:opacity-95 disabled:opacity-40 transition-opacity rounded-xl cursor-pointer"
            >
              {loading ? (
                <span>Mengirim...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Kirim Pesan
                </>
              )}
            </button>

          </form>
        </div>

      </div>

      {/* Embedded Maps Section */}
      <div className="mt-16 bg-brand-white border border-brand-light/35 p-3 rounded-[32px] overflow-hidden shadow-sm h-[450px] relative">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.7335607994644!2d110.83849927587843!3d-6.8022416665275685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e70c531d04ab575%3A0xea2be64d0084fb1e!2sJl.%20Sunan%20Kudus%2C%20Kudus!5e0!3m2!1sid!2sid!4v1718873090000!5m2!1sid!2sid"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-[22px]"
          title="Google Maps Location BARBARA"
        />
      </div>

    </div>
  );
};
