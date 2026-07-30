"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Container from "@/src/components/Container";
import { IoLockClosedOutline, IoShieldOutline } from "react-icons/io5";
import { LuPhone, LuMenu, LuX } from "react-icons/lu";

export default function AppBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-white fixed top-0 z-50 shadow-sm">
      <Container className="py-4 lg:py-[27px] flex items-center justify-between">
        
        {/* Logo */}
        <Link href={process.env.NEXT_PUBLIC_SHOPIFY_STORE_URL ?? "#"}>
          <Image
            src="/app-logo.png"
            alt="DTEL Logo"
            width={140}
            height={100}
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <IoLockClosedOutline className="text-orange-500" />
            <span>Secure Checkout</span>
          </div>

          <div className="flex items-center gap-2">
            <IoShieldOutline className="text-orange-500" />
            <span>No Hidden Fees</span>
          </div>

          <div className="flex items-center gap-2">
            <LuPhone className="text-orange-500" />
            <span>Live Support</span>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <LuX /> : <LuMenu />}
        </button>
      </Container>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 w-full bg-white shadow-md transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div className="flex flex-col gap-4 p-4 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <IoLockClosedOutline className="text-orange-500" />
            <span>Secure Checkout</span>
          </div>

          <div className="flex items-center gap-2">
            <IoShieldOutline className="text-orange-500" />
            <span>No Hidden Fees</span>
          </div>

          <div className="flex items-center gap-2">
            <LuPhone className="text-orange-500" />
            <span>Live Support</span>
          </div>
        </div>
      </div>
    </header>
  );
}