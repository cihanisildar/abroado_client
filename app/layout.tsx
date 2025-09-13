import { QueryProvider } from "@/components/providers/QueryProvider";
import { SocketProvider } from "@/lib/contexts/SocketContext";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import OAuthCallbackHandler from "@/components/OAuthCallbackHandler";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Abroado - Connect Abroad Workers & Students",
  description: "Connect with people living abroad and share experiences",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    images: [
      {
        url: "/signaling_18391003.png",
        width: 1200,
        height: 630,
        alt: "Abroado - Connect Abroad Workers & Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/signaling_18391003.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} antialiased bg-gray-50 font-sans`}
      >
        <QueryProvider>
          <SocketProvider>
            <OAuthCallbackHandler />
            <div className="min-h-screen bg-gray-50">
              <ErrorBoundary>
                <HeaderWrapper />
              </ErrorBoundary>
              <main>
                <ErrorBoundary>
                  {children}
                </ErrorBoundary>
              </main>
            </div>
          </SocketProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#10b981',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}
