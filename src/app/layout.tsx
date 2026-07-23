import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/components/providers/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "barbara",
  description:
    "barbara — contemporary unisex fashion. Bold, edgy, monochrome.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${montserrat.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-brand-white text-brand-gray antialiased" suppressHydrationWarning>
        <Script
          id="bypass-brave"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const removeAttribute = (el) => {
                  if (el && el.removeAttribute && el.hasAttribute && el.hasAttribute('bis_skin_checked')) {
                    el.removeAttribute('bis_skin_checked');
                  }
                };
                
                // Initial cleanup
                if (typeof document !== 'undefined') {
                  document.querySelectorAll('[bis_skin_checked]').forEach(removeAttribute);
                  
                  // Setup observer
                  const observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                      if (mutation.type === 'attributes' && mutation.attributeName === 'bis_skin_checked') {
                        removeAttribute(mutation.target);
                      } else if (mutation.addedNodes) {
                        mutation.addedNodes.forEach((node) => {
                          if (node.nodeType === 1) {
                            removeAttribute(node);
                            node.querySelectorAll('[bis_skin_checked]').forEach(removeAttribute);
                          }
                        });
                      }
                    });
                  });
                  
                  observer.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ['bis_skin_checked']
                  });
                }
              })();
            `
          }}
        />
        <Providers>
          <Navbar />
          <div className="flex flex-col flex-1">
            {children}
          </div>
          <Footer />
        </Providers>
        <Script
          src="https://app.sandbox.midtrans.com/snap/snap.js"
          data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}

