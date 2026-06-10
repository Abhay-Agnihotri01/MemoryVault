import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0A0A0B]">
      <Sidebar />
      <main className="flex-1 overflow-auto relative w-full">
        {/* Subtle background glow for the main content area */}
        <div className="absolute top-0 left-[20%] w-[50%] h-[30%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
