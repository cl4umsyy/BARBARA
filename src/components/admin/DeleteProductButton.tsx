"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeleteProductButtonProps {
  productId: string;
  productName: string;
}

export const DeleteProductButton: React.FC<DeleteProductButtonProps> = ({
  productId,
  productName,
}) => {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isConfirming) {
      setIsConfirming(true);
      // Auto-reset confirmation state after 4 seconds
      timerRef.current = setTimeout(() => {
        setIsConfirming(false);
      }, 4000);
      return;
    }

    // Trigger delete
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete product");
      }

      const data = await res.json();
      alert(data.message || "Product processed successfully.");
      
      // Reset state and refresh router to update Server Component data
      setIsConfirming(false);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "An error occurred during deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`inline-flex items-center gap-1.5 border text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 transition-all duration-300 rounded-xl cursor-pointer ${
        isConfirming
          ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
          : "border-brand-gray-light text-brand-gray hover:border-red-500 hover:text-red-500"
      }`}
    >
      <Trash2 className="w-3.5 h-3.5" />
      <span>{isDeleting ? "Deleting..." : isConfirming ? "Confirm?" : "Delete"}</span>
    </button>
  );
};
