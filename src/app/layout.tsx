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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${montserrat.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          id="bypass-brave"
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
      </head>
      <body className="min-h-full flex flex-col font-sans bg-brand-white text-brand-gray antialiased" suppressHydrationWarning>
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

