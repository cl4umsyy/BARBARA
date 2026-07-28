"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface HeroBanner {
  id: string;
  title: string;
  description?: string | null;
  imageUrl: string;
  buttonText?: string | null;
  buttonLink?: string | null;
  categorySlug?: string | null;
  order: number;
}

interface HeroBannerCarouselProps {
  banners: HeroBanner[];
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({ banners }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalBanners = banners.length;

  const nextSlide = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalBanners);
  }, [totalBanners]);

  const prevSlide = useCallback(() => {
    if (totalBanners <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  // Temporary pause on manual arrow/dot navigation, then auto-resume after 5 seconds
  const triggerTemporaryPause = useCallback(() => {
    setIsPaused(true);
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }
    pauseTimerRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 5000);
  }, []);

  const handleManualNext = () => {
    nextSlide();
    triggerTemporaryPause();
  };

  const handleManualPrev = () => {
    prevSlide();
    triggerTemporaryPause();
  };

  const handleManualSelect = (index: number) => {
    setCurrentIndex(index);
    triggerTemporaryPause();
  };

  // Automated infinite loop every 4.5 seconds (4500ms)
  useEffect(() => {
    if (totalBanners <= 1 || isPaused) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => clearInterval(timer);
  }, [totalBanners, isPaused, nextSlide]);

  // Clean up pause timer on unmount
  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <section
      className="relative w-full h-[550px] md:h-[650px] lg:h-[700px] bg-brand-black overflow-hidden select-none font-sans group border-b border-brand-light/20"
    >
      {/* Banner Slides Container */}
      <div
        className="w-full h-full flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, index) => {
          const targetLink =
            banner.buttonLink ||
            (banner.categorySlug ? `/shop?category=${banner.categorySlug}` : "/shop");
          const buttonLabel = banner.buttonText || "Belanja Sekarang";

          return (
            <div
              key={banner.id || index}
              className="relative min-w-full h-full flex items-center shrink-0"
            >
              {/* Background Image */}
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center filter grayscale contrast-110 brightness-90"
              />

              {/* Gradient Overlay for Optimal Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent md:from-black/80 md:via-black/45 md:to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 md:hidden" />

              {/* Slide Content */}
              <div className="relative z-10 mx-auto w-full max-w-7xl px-6 md:px-12 lg:px-16 flex flex-col justify-center gap-4">
                {banner.categorySlug && (
                  <span className="inline-block bg-brand-white text-brand-black text-[10px] md:text-xs font-black uppercase tracking-[0.3em] px-3.5 py-1 w-max border border-brand-white whitespace-nowrap">
                    {banner.categorySlug}
                  </span>
                )}

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-wider text-brand-white leading-tight max-w-2xl text-shadow-md">
                  {banner.title}
                </h2>

                {banner.description && (
                  <p className="text-xs md:text-sm text-brand-light font-medium tracking-wide uppercase max-w-xl leading-relaxed text-shadow-sm opacity-90 line-clamp-3">
                    {banner.description}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-4">
                  <Link href={targetLink} className="inline-block shrink-0">
                    <Button
                      variant="primary"
                      className="!bg-brand-white !text-brand-black hover:!bg-brand-black hover:!text-brand-white hover:!border-brand-white border border-brand-white !py-3.5 md:!py-4 !px-6 md:!px-8 text-xs md:text-sm font-black uppercase tracking-widest inline-flex items-center justify-center gap-2.5 group/btn shadow-xl transition-all whitespace-nowrap shrink-0 w-max"
                    >
                      <span className="whitespace-nowrap tracking-widest">{buttonLabel}</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1 shrink-0" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Left / Right Arrow Navigation (Only visible if > 1 banner) */}
      {totalBanners > 1 && (
        <>
          <button
            onClick={handleManualPrev}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 bg-black/40 hover:bg-brand-black text-brand-white border border-brand-white/30 hover:border-brand-white transition-all rounded-full opacity-80 group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
            aria-label="Previous Banner"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={handleManualNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 p-3 md:p-4 bg-black/40 hover:bg-brand-black text-brand-white border border-brand-white/30 hover:border-brand-white transition-all rounded-full opacity-80 group-hover:opacity-100 cursor-pointer backdrop-blur-xs"
            aria-label="Next Banner"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Dot Indicators at Bottom (Only visible if > 1 banner) */}
      {totalBanners > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 md:gap-3 bg-black/50 px-4 py-2 rounded-full border border-brand-white/20 backdrop-blur-xs">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleManualSelect(idx)}
              className={`h-2 transition-all duration-300 rounded-full cursor-pointer ${
                currentIndex === idx
                  ? "w-8 bg-brand-white"
                  : "w-2 bg-brand-white/40 hover:bg-brand-white/70"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};
