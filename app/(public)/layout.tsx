import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/signaling_18391003.png";

export const metadata: Metadata = {
  title: "Gurbetci - Join the Community",
  description: "Connect with people living abroad",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Netflix-style Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4 lg:p-6">
        <div className="flex items-center">
          <Link 
            href="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-50 rounded-[1rem] rotate-[10deg] flex items-center justify-center transform transition-transform hover:rotate-0 duration-300">
              <Image
                src={logo}
                alt="Abroado Signpost"
                className="w-5 h-5"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Abroado
            </h1>
          </Link>
        </div>
      </header>
      
      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
