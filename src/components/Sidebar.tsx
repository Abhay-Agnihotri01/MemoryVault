"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutGrid,
  FolderHeart,
  CalendarDays,
  Settings,
  LogOut,
  Camera,
  Trash2,
  Heart,
  UserSearch,
  Menu,
  X,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "All Media", href: "/dashboard", icon: LayoutGrid },
    { name: "Albums", href: "/dashboard/albums", icon: FolderHeart },
    { name: "Timeline", href: "/dashboard/timeline", icon: CalendarDays },
    { name: "Favorites", href: "/dashboard/favorites", icon: Heart },
    { name: "Faces", href: "/dashboard/faces", icon: UserSearch },
    { name: "Publish", href: "/dashboard/publish", icon: Camera },
    { name: "Trash", href: "/dashboard/trash", icon: Trash2 },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0F0F12] border-b border-white/5 sticky top-0 z-40">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">MemoryVault</span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="text-white p-2 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#0F0F12] border-r border-white/5 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Area (Hidden on mobile top, shown in drawer) */}
          <div className="h-20 flex items-center justify-between px-8 border-b border-white/5">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight hidden md:block lg:block">MemoryVault</span>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2 mt-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-pink-400" : ""}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
