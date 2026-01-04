"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          {/* ---------------- Logo (Left) ---------------- */}
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

          {/* ---------------- Center Links ---------------- */}
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

          {/* ---------------- CTA (Right) ---------------- */}
          <div className="ml-auto hidden lg:block">
            <Link href="/auth/login">
              <button className="bg-linear-to-r from-blue-600 to-cyan-500 text-white px-6 py-2.5 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all">
                Get Started
              </button>
            </Link>
          </div>

          {/* ---------------- Mobile Menu ---------------- */}
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

                  <Link href="/auth/login">
                    <button className="mt-4 w-full bg-linear-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-full font-semibold">
                      Get Started
                    </button>
                  </Link>
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
