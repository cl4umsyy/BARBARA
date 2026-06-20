import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-2">
        <label
          htmlFor={inputId}
          className="text-xs uppercase tracking-wider text-brand-black"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`input-minimalist ${className}`}
          {...props}
        />
        {error && <p className="text-red-500 text-xs">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
