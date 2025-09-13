"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LogIn, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import logo from "../public/signaling_18391003.png";
import { redirectToLogin } from "@/utils/authHelpers";

export function PublicHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(initialQuery);

  const placeholder = pathname.startsWith("/rooms")
    ? "Search rooms..."
    : pathname.startsWith("/cities")
    ? "Search city reviews..."
    : "Search posts and reviews...";

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value;
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Image src={logo} alt="logo" width={32} height={32} />
            <span className="text-xl font-bold text-orange-500 group-hover:text-orange-600 transition-colors">
              Abroado
            </span>
          </Link>

          {/* Center Search */}
          <div className="flex-1 px-6 hidden md:block">
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 h-10 rounded-full border-gray-200 focus:border-orange-300 focus:ring-orange-200"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 mr-4">
            <Link href="/posts">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl px-4"
              >
                <span className="font-medium">Posts</span>
              </Button>
            </Link>
            <Link href="/cities">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl px-4"
              >
                <span className="font-medium">Cities</span>
              </Button>
            </Link>
            <Link href="/rooms">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl px-4"
              >
                <span className="font-medium">Rooms</span>
              </Button>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            {/* Create Post Button - Redirects to Login */}
            <Button
              size="sm"
              onClick={() => redirectToLogin('/posts/create')}
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 font-semibold rounded-xl transition-all duration-200 px-4"
            >
              <Plus size={16} className="mr-2" />
              Create
            </Button>
            
            {/* Login Button */}
            <Link href="/auth/login">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl px-6"
              >
                <LogIn size={16} className="mr-2" />
                Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200/50 bg-white/90 backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-1 py-2 px-2">
          <Link
            href="/"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link
            href="/posts"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <span className="text-xs mt-1 font-medium">Posts</span>
          </Link>
          <Link
            href="/cities"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <span className="text-xs mt-1 font-medium">Cities</span>
          </Link>
          <Link
            href="/rooms"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <span className="text-xs mt-1 font-medium">Rooms</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}