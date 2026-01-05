"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Menu, X, Shield, ChevronRight, LogOut, Calendar } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/* -------------------- Sheet (Mobile Drawer) -------------------- */

const Sheet = ({ children }: { children: React.ReactNode }) => <>{children}</>;

const SheetTrigger = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => <div onClick={onClick}>{children}</div>;

const SheetContent = ({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl">
        {children}
      </div>
    </div>
  );
};

const SheetHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-6 border-b">{children}</div>
);

const SheetTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-bold">{children}</h2>
);

const SheetClose = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => <div onClick={onClick}>{children}</div>;

/* -------------------- Navbar -------------------- */

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/profile");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out successfully");
      setUser(null);
      router.push("/");
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

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Resources", href: "#resources" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur shadow-md" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center relative">
          {/* Logo (Left) */}
          <Link href="/" className="flex items-center gap-2 z-10">
            <div className="w-10 h-10 bg-linear-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span
              className={`text-xl font-bold ${
                scrolled ? "text-slate-900" : "text-white"
              }`}
            >
              WellTrack
            </span>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`font-medium transition-colors ${
                  scrolled
                    ? "text-slate-700 hover:text-blue-600"
                    : "text-white/90 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section - User Dropdown or Get Started */}
          <div className="ml-auto hidden lg:flex items-center gap-4">
            {!isLoadingUser && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none">
                  <div className="flex items-center gap-2 rounded-lg hover:bg-white/10 transition-colors p-1 cursor-pointer">
                    <Avatar className="h-8 w-8 border border-blue-500">
                      <AvatarFallback className="bg-blue-600 text-white font-semibold text-xs">
                        {user.firstname.charAt(0).toUpperCase()}
                        {user.lastname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p
                        className={`text-xs font-medium ${
                          scrolled ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {user.firstname}
                      </p>
                      <p
                        className={`text-[10px] uppercase tracking-wider ${
                          scrolled ? "text-slate-500" : "text-white/60"
                        }`}
                      >
                        {user.role}
                      </p>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 ${
                        scrolled ? "text-slate-600" : "text-white/60"
                      }`}
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={`w-56 ${
                    scrolled
                      ? "bg-white border-slate-200"
                      : "bg-slate-900 border-slate-800"
                  } mt-2`}
                  align="end"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 border border-blue-500">
                        <AvatarFallback className="bg-blue-600 text-white font-semibold text-sm">
                          {user.firstname.charAt(0).toUpperCase()}
                          {user.lastname.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            scrolled ? "text-slate-900" : "text-white"
                          }`}
                        >
                          {user.firstname} {user.lastname}
                        </p>
                        <p
                          className={`text-xs ${
                            scrolled ? "text-slate-500" : "text-slate-400"
                          }`}
                        >
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div
                        className={`flex items-center gap-2 text-xs ${
                          scrolled ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5 text-blue-500" />
                        <span className="capitalize">{user.role} Account</span>
                      </div>
                      <div
                        className={`flex items-center gap-2 text-xs ${
                          scrolled ? "text-slate-600" : "text-slate-400"
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        <span>Joined {formatDate(user.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <DropdownMenuSeparator
                    className={scrolled ? "bg-slate-200" : "bg-slate-800"}
                  />
                  <DropdownMenuItem
                    asChild
                    className={
                      scrolled ? "hover:bg-slate-100" : "hover:bg-slate-800"
                    }
                  >
                    <Link href="/admin-dashboard">Go to Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator
                    className={scrolled ? "bg-slate-200" : "bg-slate-800"}
                  />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className={`${
                      scrolled
                        ? "text-red-600 focus:text-red-700 focus:bg-red-50"
                        : "text-red-500 focus:text-red-400 focus:bg-red-500/10"
                    }`}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/sign-in">
                <button className="bg-linear-to-r from-blue-600 to-cyan-500 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all">
                  Get Started
                </button>
              </Link>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="ml-auto lg:hidden">
            <Sheet>
              <SheetTrigger onClick={() => setIsOpen(true)}>
                <button
                  className={`p-2 rounded-lg ${
                    scrolled
                      ? "text-slate-900 hover:bg-slate-100"
                      : "text-white hover:bg-white/10"
                  }`}
                >
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>

              <SheetContent open={isOpen} onClose={() => setIsOpen(false)}>
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 bg-linear-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <SheetTitle>WellTrack</SheetTitle>
                    </div>
                    <SheetClose onClick={() => setIsOpen(false)}>
                      <X className="w-5 h-5 text-slate-700" />
                    </SheetClose>
                  </div>
                </SheetHeader>

                <div className="p-6 flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-100 font-medium"
                    >
                      {link.name}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ))}

                  {/* Mobile: Show user info and logout in drawer */}
                  {!isLoadingUser && user ? (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar className="h-10 w-10 border border-blue-500">
                          <AvatarFallback className="bg-blue-600 text-white font-semibold">
                            {user.firstname.charAt(0).toUpperCase()}
                            {user.lastname.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {user.firstname} {user.lastname}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <Link href="/dashboard">
                        <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mb-2">
                          Dashboard
                        </button>
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="w-full px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  ) : (
                    <Link href="/sign-in">
                      <button className="mt-4 w-full bg-linear-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-full font-semibold">
                        Get Started
                      </button>
                    </Link>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
