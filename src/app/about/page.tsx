import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, Truck, Users, Star, ArrowRight, Heart, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Tentang Kami - BARBARA",
  description: "Mengenal brand fashion contemporary unisex BARBARA. Visi, misi, cerita kami, dan tim di balik produk streetwear premium.",
};

export default function AboutPage() {
  const stats = [
    { value: "1.000+", label: "Produk Terjual" },
    { value: "500+", label: "Pelanggan Aktif" },
    { value: "50+", label: "Koleksi Eksklusif" },
    { value: "4.9", label: "Rating Kepuasan", isStar: true },
  ];

  const features = [
    {
      icon: Award,
      title: "Produk Berkualitas",
      desc: "Setiap produk melalui kurasi ketat untuk menjamin standar jahitan dan bahan kain terbaik kelas premium.",
    },
    {
      icon: Heart,
      title: "Harga Kompetitif",
      desc: "Menyajikan koleksi streetwear premium dengan penawaran harga terbaik di kelas fashion kontemporer.",
    },
    {
      icon: Truck,
      title: "Pengiriman Cepat",
      desc: "Sistem logistik yang efisien memastikan pesanan Anda dikemas rapi dan dikirim dengan aman dalam waktu singkat.",
    },
    {
      icon: ShieldCheck,
      title: "Pembayaran Aman",
      desc: "Didukung dengan integrasi payment gateway terenkripsi penuh demi kenyamanan transaksi belanja Anda.",
    },
    {
      icon: Users,
      title: "Dukungan Responsif",
      desc: "Tim layanan pelanggan kami selalu siap sedia membantu menjawab pertanyaan dan memandu belanja Anda.",
    },
  ];

  const team = [
    {
      name: "Barbara Clarissa",
      role: "Founder & Creative Director",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&h=500&q=80",
    },
    {
      name: "Marcus Thorne",
      role: "Lead Fashion Designer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&h=500&q=80",
    },
    {
      name: "Amara Sterling",
      role: "Head of Brand Operations",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&h=500&q=80",
    },
  ];

  return (
    <main className="w-full bg-brand-white text-brand-black pb-24 font-sans">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 md:px-8 lg:px-16">
        <div className="flex flex-col gap-1.5 border-b border-brand-light/35 pb-6 mb-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">Mengenal Brand Kami</p>
          <h1 className="text-3xl md:text-5xl font-black tracking-widest text-brand-black uppercase">Tentang BARBARA</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 flex flex-col gap-6">
            <h2 className="text-xl md:text-3xl font-black tracking-wide leading-tight">
              Mendefinisikan Ulang Streetwear Kontemporer
            </h2>
            <p className="text-sm text-brand-gray-light leading-relaxed font-medium">
              BARBARA lahir dari sebuah visi sederhana: menghadirkan koleksi busana contemporary unisex yang berkarakter kuat, berani, dan didominasi oleh estetika monokromatik. Kami percaya bahwa pakaian bukan sekadar penutup tubuh, melainkan perpanjangan dari identitas dan cara mengekspresikan diri di tengah dinamika urban.
            </p>
            <p className="text-sm text-brand-gray-light leading-relaxed font-medium">
              Setiap potongan kain yang kami kurasi dirancang untuk melampaui batas gender konvensional, memberikan keleluasaan dalam gaya berpakaian streetwear modern tanpa mengorbankan kualitas kenyamanan harian Anda.
            </p>
          </div>
          <div className="lg:col-span-6">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl shadow-sm bg-brand-light border border-brand-light/35">
              <Image
                alt="BARBARA Fashion Presentation"
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Cerita & Visi Kami */}
      <section className="bg-brand-light/25 border-y border-brand-light/35 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-brand-white border border-brand-light/35 p-8 rounded-3xl shadow-sm flex flex-col gap-4">
              <span className="w-12 h-12 bg-brand-light flex items-center justify-center rounded-2xl text-brand-black">
                <Heart className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-black tracking-wider uppercase mt-2">Cerita Kami</h3>
              <p className="text-xs text-brand-gray-light font-medium leading-relaxed">
                Dimulai sebagai kurasi thrift premium berskala lokal, BARBARA berkembang menjadi platform fashion online tepercaya yang menawarkan koleksi unisex handpicked terlengkap untuk pria dan wanita. Kami konsisten menyajikan produk dengan siluet minimalis, warna-warna netral, dan detail modern yang menjawab kebutuhan tren masa kini.
              </p>
            </div>

            <div className="bg-brand-white border border-brand-light/35 p-8 rounded-3xl shadow-sm flex flex-col gap-4">
              <span className="w-12 h-12 bg-brand-light flex items-center justify-center rounded-2xl text-brand-black">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <h3 className="text-lg font-black tracking-wider uppercase mt-2">Visi Kami</h3>
              <p className="text-xs text-brand-gray-light font-medium leading-relaxed">
                Menjadi destinasi fashion kontemporer utama yang menginspirasi kepercayaan diri setiap individu di Indonesia. Kami berdedikasi membangun ekosistem belanja digital yang aman, transparan, cepat, dan selalu menempatkan kepuasan serta kenyamanan pelanggan sebagai prioritas tertinggi kami.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistik Cards */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-brand-white border border-brand-light/35 p-6 rounded-2xl shadow-sm text-center flex flex-col gap-2 transition-all duration-300 hover:shadow-md"
            >
              <span className="text-2xl md:text-4xl font-black tracking-wide text-brand-black flex items-center justify-center gap-1">
                {stat.value}
                {stat.isStar && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-gray-light">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Mengapa Memilih Kami */}
      <section className="bg-brand-light/10 border-t border-brand-light/20 py-20">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">Kelebihan Kami</p>
            <h2 className="text-2xl md:text-3xl font-black tracking-wider uppercase">Mengapa Memilih Kami</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {features.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div key={idx} className="flex flex-col items-center text-center gap-4 group">
                  <span className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center text-brand-black transition-colors duration-300 group-hover:bg-brand-black group-hover:text-brand-white">
                    <IconComp className="w-6 h-6" />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-xs font-black uppercase tracking-wider">{feat.title}</h4>
                    <p className="text-[11px] text-brand-gray-light leading-relaxed font-medium px-2">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tim Kami */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 lg:px-16">
        <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gray-light">Dibalik Layar</p>
          <h2 className="text-2xl md:text-3xl font-black tracking-wider uppercase">Tim Kami</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((member, idx) => (
            <div
              key={idx}
              className="bg-brand-white border border-brand-light/35 p-4 rounded-3xl shadow-sm flex flex-col gap-4 group"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-brand-light">
                <Image
                  alt={member.name}
                  src={member.image}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover filter grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col px-2 pb-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-brand-black">{member.name}</h4>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gray-light mt-0.5">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 lg:px-16">
        <div className="bg-brand-black text-brand-white p-8 md:p-16 rounded-[32px] text-center flex flex-col items-center justify-center gap-6 relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-transparent to-transparent opacity-40 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-3 max-w-2xl">
            <h2 className="text-2xl md:text-4xl font-black tracking-widest uppercase text-brand-white">
              Mulai Belanja Sekarang
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 font-medium tracking-wide leading-relaxed">
              Jelajahi koleksi streetwear contemporary unisex terbaik kami dan temukan busana yang paling cocok untuk mengekspresikan karakter urban Anda.
            </p>
          </div>

          <div className="relative z-10">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-brand-white text-brand-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-brand-light transition-all shadow-md group cursor-pointer"
            >
              Jelajahi Produk
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
