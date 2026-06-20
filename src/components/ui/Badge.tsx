import React from "react";

interface BadgeProps {
  variant?: "solid" | "outline";
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "solid",
  children,
  className = "",
}) => {
  const variants = {
    solid: "bg-brand-black text-brand-white",
    outline: "border border-black text-brand-black bg-transparent",
  };

  return (
    <span
      className={`inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
