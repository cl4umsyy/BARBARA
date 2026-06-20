# Design System Reference

## 1. Layout (`src/app/layout.tsx`)

```tsx
import { Montserrat } from 'next/font/google';
import './globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-montserrat',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${montserrat.variable}`}>
      <body className="font-sans bg-white text-[#333333] antialiased">
        {children}
      </body>
    </html>
  );
}
```

## 2. Globals CSS (`src/app/globals.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: var(--font-montserrat), sans-serif;

  --color-brand-black: #000000;
  --color-brand-dark: #1A1A1A;
  --color-brand-gray: #333333;
  --color-brand-gray-light: #999999;
  --color-brand-light: #F5F5F5;
  --color-brand-white: #FFFFFF;
}

@layer base {
  h1, h2, h3, h4, h5, h6 {
    @apply uppercase tracking-wider font-bold text-brand-black;
  }
}

.input-minimalist {
  @apply w-full bg-transparent border-b border-[#E0E0E0] border-t-0 border-x-0
         py-3 px-0 outline-none rounded-none text-brand-black placeholder-brand-gray-light
         focus:border-brand-black transition-colors duration-200;
}
```

## 3. Button (`src/components/ui/Button.tsx`)

```tsx
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-block text-center font-bold uppercase tracking-[0.2em] text-sm py-4 px-10 transition-all duration-300 ease-out rounded-none border-2 border-black focus:outline-none cursor-pointer';

  const variants = {
    primary: 'bg-brand-black text-brand-white hover:bg-brand-white hover:text-brand-black',
    secondary: 'bg-transparent text-brand-black hover:bg-brand-black hover:text-brand-white',
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
```

## 4. ProductCard (`src/components/product/ProductCard.tsx`)

```tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  slug: string;
  name: string;
  price: number;
  imageUrl: string;
  hoverImageUrl?: string;
  isNew?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  slug,
  name,
  price,
  imageUrl,
  hoverImageUrl,
  isNew,
}) => {
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="group relative flex flex-col bg-brand-white">
      <Link href={`/shop/${slug}`} className="relative aspect-[3/4] w-full overflow-hidden bg-brand-light">
        {isNew && (
          <span className="absolute top-4 left-4 z-10 bg-brand-black text-brand-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
            NEW
          </span>
        )}
        <Image
          src={imageUrl}
          alt={name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {hoverImageUrl && (
          <Image
            src={hoverImageUrl}
            alt={`${name} alt`}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 absolute inset-0"
          />
        )}
      </Link>
      <div className="flex flex-col pt-4">
        <Link href={`/shop/${slug}`} className="text-sm font-semibold uppercase tracking-wider text-brand-black hover:opacity-75 transition-opacity">
          {name}
        </Link>
        <span className="text-sm font-bold text-brand-black mt-1">
          {formatPrice(price)}
        </span>
      </div>
    </div>
  );
};
```
