"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Logo } from "./Logo";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Fonctionnalités", href: "#features" },
    { name: "Vocabulaire", href: "#vocab" },
    { name: "Tarifs", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/80 dark:bg-brand-dark/80 backdrop-blur-xl shadow-sm py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-brand-blue dark:hover:text-brand-gold transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <ThemeToggle />
          <Link href="/login">
            <Button variant="ghost" className="font-bold">Connexion</Button>
          </Link>
          <Link href="/login?mode=signup">
            <Button className="bg-brand-blue hover:bg-brand-blue/90 text-white font-black px-6 rounded-xl shadow-lg shadow-brand-blue/20">
              Essai Gratuit
            </Button>
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <Link href="/login?mode=signup">
            <Button size="sm" className="bg-brand-blue text-white font-black rounded-lg text-xs h-9 px-3">
              Essai Gratuit
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-900 dark:text-white"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 top-[72px] bg-white dark:bg-brand-dark z-40 md:hidden flex flex-col p-8 gap-8"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-2xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/10 pb-4"
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-auto flex flex-col gap-4">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full h-14 rounded-2xl font-black text-lg">Connexion</Button>
              </Link>
              <Link href="/login?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full h-14 bg-brand-blue text-white rounded-2xl font-black text-lg shadow-xl shadow-brand-blue/20">
                  Commencer gratuitement <ChevronRight className="ml-2" />
                </Button>
              </Link>
              <div className="flex justify-center pt-4">
                <ThemeToggle />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
