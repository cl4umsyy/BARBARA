import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-block text-center font-bold uppercase tracking-[0.2em] text-sm py-4 px-10 transition-all duration-300 ease-out rounded-xl border-2 border-black focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black",
    secondary:
      "bg-transparent text-brand-black hover:bg-brand-black hover:text-brand-white",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
