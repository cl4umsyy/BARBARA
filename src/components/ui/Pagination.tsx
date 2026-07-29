"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  className?: string;
  showPageNumbers?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
  className = "",
  showPageNumbers = true,
}) => {
  if (totalPages <= 1) return null;

  const isPrevDisabled = currentPage <= 1 || disabled;
  const isNextDisabled = currentPage >= totalPages || disabled;

  // Generate page numbers array with optional truncation for large totalPages
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show page 1
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push("...");
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div
      className={`flex items-center justify-center gap-2 ${className}`}
      aria-label="Navigasi Halaman"
    >
      {/* Tombol Prev */}
      <button
        type="button"
        onClick={() => !isPrevDisabled && onPageChange(currentPage - 1)}
        disabled={isPrevDisabled}
        aria-label="Halaman Sebelumnya"
        className={`inline-flex items-center justify-center h-10 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ease-in-out select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
          isPrevDisabled
            ? "bg-brand-white/80 dark:bg-brand-dark/80 text-brand-gray-light dark:text-brand-gray-light border-brand-light dark:border-brand-gray/40 opacity-45 cursor-not-allowed hover:bg-brand-white/80 dark:hover:bg-brand-dark/80 hover:text-brand-gray-light dark:hover:text-brand-gray-light hover:border-brand-light dark:hover:border-brand-gray/40"
            : "bg-brand-white dark:bg-brand-dark text-brand-black dark:text-brand-white border-brand-light dark:border-brand-gray/60 hover:border-brand-black dark:hover:border-white hover:bg-brand-light/40 dark:hover:bg-brand-gray/40 active:scale-95 cursor-pointer"
        }`}
      >
        <ChevronLeft className="w-4 h-4 mr-1 shrink-0" />
        <span>Prev</span>
      </button>

      {/* Nomor Halaman */}
      {showPageNumbers && (
        <div className="flex items-center gap-2">
          {getPageNumbers().map((page, idx) => {
            if (typeof page === "string") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="inline-flex items-center justify-center h-10 w-9 text-xs font-bold text-brand-gray-light dark:text-brand-gray-light select-none"
                >
                  {page}
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = currentPage === pageNum;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => !disabled && !isActive && onPageChange(pageNum)}
                disabled={disabled}
                aria-current={isActive ? "page" : undefined}
                aria-label={`Halaman ${pageNum}`}
                className={`inline-flex items-center justify-center h-10 min-w-[40px] px-3 rounded-xl border text-xs font-black transition-all duration-200 ease-in-out select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-brand-black text-brand-white border-brand-black ring-2 ring-brand-black/20 shadow-md scale-105 dark:bg-white dark:text-black dark:border-white dark:ring-2 dark:ring-white/60 dark:shadow-[0_0_12px_rgba(255,255,255,0.4)] hover:bg-brand-gray dark:hover:bg-gray-200 hover:text-brand-white dark:hover:text-black hover:border-brand-gray dark:hover:border-gray-200"
                    : disabled
                    ? "bg-brand-white/80 dark:bg-brand-dark/80 text-brand-gray-light dark:text-brand-gray-light border-brand-light dark:border-brand-gray/40 opacity-45 cursor-not-allowed"
                    : "bg-brand-white dark:bg-brand-dark text-brand-black dark:text-brand-white border-brand-light dark:border-brand-gray/60 hover:border-brand-black dark:hover:border-white hover:bg-brand-light/40 dark:hover:bg-brand-gray/40 active:scale-95 cursor-pointer"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
      )}

      {/* Tombol Next */}
      <button
        type="button"
        onClick={() => !isNextDisabled && onPageChange(currentPage + 1)}
        disabled={isNextDisabled}
        aria-label="Halaman Selanjutnya"
        className={`inline-flex items-center justify-center h-10 px-4 rounded-xl border text-xs font-black uppercase tracking-wider transition-all duration-200 ease-in-out select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-black dark:focus-visible:ring-white focus-visible:ring-offset-2 ${
          isNextDisabled
            ? "bg-brand-white/80 dark:bg-brand-dark/80 text-brand-gray-light dark:text-brand-gray-light border-brand-light dark:border-brand-gray/40 opacity-45 cursor-not-allowed hover:bg-brand-white/80 dark:hover:bg-brand-dark/80 hover:text-brand-gray-light dark:hover:text-brand-gray-light hover:border-brand-light dark:hover:border-brand-gray/40"
            : "bg-brand-white dark:bg-brand-dark text-brand-black dark:text-brand-white border-brand-light dark:border-brand-gray/60 hover:border-brand-black dark:hover:border-white hover:bg-brand-light/40 dark:hover:bg-brand-gray/40 active:scale-95 cursor-pointer"
        }`}
      >
        <span>Next</span>
        <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
      </button>
    </div>
  );
};
