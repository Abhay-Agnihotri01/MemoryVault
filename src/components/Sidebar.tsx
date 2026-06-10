"use client";

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
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

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
    <aside className="w-64 h-screen sticky top-0 bg-[#0F0F12] border-r border-white/5 flex flex-col justify-between">
      <div>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-pink-500 to-violet-500 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] transition-all">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">MemoryVault</span>
          </Link>
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
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
