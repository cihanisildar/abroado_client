"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  LogOut,
  MapPin,
  MessageSquare,
  Plus,
  Search,
  Settings,
  User,
  Users,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import Image from "next/image";
import logo from "../public/signaling_18391003.png";

export function Header() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
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

  // Update local state while typing
  const handleInputChange = (value: string) => {
    setSearchTerm(value);
  };

  // Execute search when user presses Enter
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

  // Don't render anything until auth state is loaded
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

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

          {/* Navigation Links & Actions */}
          <div className="hidden md:flex items-center space-x-1 mr-2">
            <Link href="/cities">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl px-4"
              >
                <MapPin size={18} />
                <span className="font-medium">Cities</span>
              </Button>
            </Link>
            <Link href="/rooms">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl px-4"
              >
                <Users size={18} />
                <span className="font-medium">Rooms</span>
              </Button>
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Create Post Button */}
            <Link href="/posts/create">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg rounded-xl transition-all duration-200 hover:shadow-xl px-4"
              >
                <Plus size={16} className="mr-2" />
                Create
              </Button>
            </Link>
            {/* User Menu with Dropdown */}
            <DropdownMenu
              trigger={
                user?.avatar ? (
                  <div className="cursor-pointer w-10 h-10 hover:ring-2 hover:ring-orange-300 hover:shadow-lg transition-all rounded-full overflow-hidden">
                    <Image
                      src={user.avatar}
                      alt={user.username || "User"}
                      className="w-full h-full object-cover"
                      width={40}
                      height={40}
                    />
                  </div>
                ) : (
                  <div className="cursor-pointer w-10 h-10 hover:ring-2 hover:ring-orange-300 hover:shadow-lg transition-all rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                    {user?.username
                      ? user.username.charAt(0).toUpperCase()
                      : "U"}
                  </div>
                )
              }
            >
              <DropdownMenuItem
                onClick={() => (window.location.href = "/profile")}
              >
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>Profile</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => (window.location.href = "/settings")}
              >
                <div className="flex items-center space-x-2">
                  <Settings size={16} />
                  <span>Settings</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout.mutate(undefined, {
                    onSuccess: () => {
                      router.replace('/auth/login');
                    },
                  });
                }}
                className="text-red-600 hover:bg-red-50"
              >
                <div className="flex items-center space-x-2">
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200/50 bg-white/90 backdrop-blur-sm">
        <div className="grid grid-cols-5 gap-1 py-2 px-2">
          <Link
            href="/"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <Home size={20} />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>
          <Link
            href="/cities"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <MapPin size={20} />
            <span className="text-xs mt-1 font-medium">Cities</span>
          </Link>
          <Link
            href="/"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <MessageSquare size={20} />
            <span className="text-xs mt-1 font-medium">Posts</span>
          </Link>
          <Link
            href="/rooms"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <Users size={20} />
            <span className="text-xs mt-1 font-medium">Rooms</span>
          </Link>
          <Link
            href="/profile"
            className="flex flex-col items-center py-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all duration-200 rounded-xl"
          >
            <User size={20} />
            <span className="text-xs mt-1 font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
