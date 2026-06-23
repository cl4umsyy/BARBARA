"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Star, Upload, Trash2, Loader2, Camera } from "lucide-react";
import Image from "next/image";

interface Review {
  id: string;
  rating: number;
  review: string;
  reviewImages: string[];
  createdAt: string;
}

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  existingReview?: Review | null;
  onSubmitSuccess: (review: any) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  userId,
  orderId,
  orderItemId,
  productId,
  productName,
  existingReview,
  onSubmitSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating);
        setReviewText(existingReview.review);
        setExistingImages(existingReview.reviewImages || []);
      } else {
        setRating(5);
        setReviewText("");
        setExistingImages([]);
      }
      setImages([]);
      setImagePreviews([]);
      setError(null);
    }
  }, [isOpen, existingReview]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setImages((prev) => [...prev, ...selectedFiles]);

      const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveNewImage = (idx: number) => {
    URL.revokeObjectURL(imagePreviews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveExistingImage = (idx: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) {
      setError("Ulasan komentar tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("userId", userId);
      formData.append("order_id", orderId);
      formData.append("orderId", orderId);
      formData.append("order_item_id", orderItemId);
      formData.append("orderItemId", orderItemId);
      formData.append("product_id", productId);
      formData.append("productId", productId);
      formData.append("rating", rating.toString());
      formData.append("review", reviewText.trim());
      formData.append("comment", reviewText.trim());
      formData.append("existingImages", JSON.stringify(existingImages));

      images.forEach((file) => {
        formData.append("review_images", file);
        formData.append("files", file);
      });

      const res = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal menyimpan ulasan");
      }

      const data = await res.json();
      onSubmitSuccess(data.review);
      onClose();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyimpan ulasan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-brand-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-brand-light max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-light bg-[#fbfbfb]">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-black">
              {existingReview ? "Edit Ulasan Produk" : "Tulis Ulasan Produk"}
            </h3>
            <p className="text-[10px] text-brand-gray truncate max-w-[320px] font-medium mt-0.5">
              {productName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-brand-gray hover:text-brand-black hover:bg-brand-light transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 flex flex-col gap-6">
          
          {error && (
            <div className="bg-red-50 text-red-600 text-xs p-4 rounded-xl border border-red-100 flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          {/* Star Rating */}
          <div className="flex flex-col items-center gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-brand-black">
              Berikan Rating
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating ?? rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-brand-light fill-brand-light/30"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-[10px] uppercase font-black text-brand-gray-light tracking-widest">
              {rating === 5 ? "Sempurna" : rating === 4 ? "Sangat Baik" : rating === 3 ? "Baik" : rating === 2 ? "Cukup" : "Buruk"}
            </span>
          </div>

          {/* Review text */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-black uppercase tracking-widest text-brand-black">
              Komentar Ulasan
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Tulis ulasan Anda tentang kualitas produk, bahan, ukuran fitting, dll..."
              rows={4}
              className="w-full text-xs p-4 border border-brand-light rounded-xl focus:border-brand-black focus:outline-none transition-colors placeholder:text-brand-gray-light leading-relaxed"
            />
          </div>

          {/* Image Upload */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-black uppercase tracking-widest text-brand-black">
              Unggah Foto Produk (Opsional)
            </label>
            
            {/* Image previews */}
            <div className="flex flex-wrap gap-3">
              {/* Existing Images */}
              {existingImages.map((url, idx) => (
                <div key={`exist-${idx}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-light bg-brand-light">
                  <Image src={url} alt="Review Image" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* New Previews */}
              {imagePreviews.map((preview, idx) => (
                <div key={`new-${idx}`} className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-light bg-brand-light">
                  <Image src={preview} alt="Preview Image" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full hover:bg-red-600 transition-colors shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Upload Trigger */}
              {(existingImages.length + images.length) < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-brand-light hover:border-brand-black rounded-xl flex flex-col items-center justify-center text-brand-gray hover:text-brand-black transition-colors cursor-pointer"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[8px] font-bold uppercase tracking-wider">Foto</span>
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <p className="text-[9px] text-brand-gray-light leading-relaxed">
              Maksimal 5 foto. Format yang didukung: JPG, PNG, WEBP.
            </p>
          </div>

          {/* Action Row */}
          <div className="border-t border-brand-light pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="font-bold uppercase tracking-wider text-xs px-5 py-4 border border-brand-black hover:bg-brand-black hover:text-brand-white rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="font-bold uppercase tracking-wider text-xs px-6 py-4 bg-brand-black text-brand-white border border-brand-black hover:bg-brand-white hover:text-brand-black rounded-xl transition-all duration-300 cursor-pointer flex items-center gap-1.5 disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                "Kirim Ulasan"
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
