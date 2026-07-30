import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keranjang",
  description: "Lihat dan kelola item di keranjang belanja Anda di BARBARA.",
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
