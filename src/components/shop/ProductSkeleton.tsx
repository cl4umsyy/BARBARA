import React from "react";

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col bg-brand-white border border-brand-light/35 p-3 rounded-xl animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-[3/4] w-full bg-brand-light/70 rounded-xl mb-3" />

      {/* Brand Skeleton */}
      <div className="h-3 w-16 bg-brand-light/80 rounded mb-1.5" />

      {/* Size & Condition Skeleton */}
      <div className="h-3.5 w-24 bg-brand-light/80 rounded mb-2" />

      {/* Title Skeleton */}
      <div className="h-4 w-4/5 bg-brand-light/80 rounded mb-3" />

      {/* Price & Likes Row Skeleton */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="h-4 w-20 bg-brand-light/80 rounded" />
        <div className="h-3.5 w-8 bg-brand-light/80 rounded" />
      </div>
    </div>
  );
};
