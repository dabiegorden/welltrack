"use client";

import { type ReactNode, useEffect, useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, LogOut, ChevronDown, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { AppSidebar } from "@/constants";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        console.log("Fetched user data:", data);
        if (data.user) {
          setUser(data.user);
        } else {
          router.push("/sign-in");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/sign-in");
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      router.push("/sign-in");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar role={user?.role} />
      <SidebarInset>
        <header className="fixed top-0 right-0 left-0 z-50 flex h-16 shrink-0 items-center gap-2 bg-gray-950 border-b border-gray-800 shadow-lg px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="text-gray-300 hover:bg-gray-800/50 hover:text-white transition-colors" />
            <Separator orientation="vertical" className="h-4 bg-gray-700/50" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <Link
                    href="/admin-dashboard"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block text-gray-600/50" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white font-semibold">
                    Overview
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-300 hover:bg-gray-800/50 relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full"></span>
            </Button>

            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-2 rounded-lg hover:bg-gray-800/50 transition-colors p-1 cursor-pointer">
                    <Avatar className="h-8 w-8 border border-blue-500/50">
                      <AvatarFallback className="bg-blue-600 text-white font-semibold">
                        {user.firstname.charAt(0).toUpperCase()}
                        {user.lastname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-medium text-white">
                        {user.firstname} {user.lastname}
                      </p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {user.role}
                      </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-gray-950 border-gray-800/50 text-gray-200 mt-2"
                  align="end"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border border-blue-500/50">
                        <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                          {user.firstname.charAt(0).toUpperCase()}
                          {user.lastname.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {user.firstname} {user.lastname}
                        </p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Shield className="h-3.5 w-3.5 text-blue-500" />
                        <span className="capitalize">{user.role} Account</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>Joined {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-gray-800/50" />
                  <DropdownMenuLabel className="text-xs">
                    <Link href={"/admin-dashboard/account-settings"}>
                      Account Settings
                    </Link>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800/50" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-500 focus:text-red-400 focus:bg-red-500/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        <main className="pt-16 min-h-screen bg-gray-950 text-white p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
