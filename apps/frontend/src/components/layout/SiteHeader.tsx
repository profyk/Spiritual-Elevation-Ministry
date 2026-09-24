"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/services/prophetic-ministry", label: "Prophetic Ministry" },
  { href: "/services/healing-deliverance", label: "Healing & Deliverance" },
  { href: "/services/coaching", label: "Coaching" },
  { href: "/services/events", label: "Events" },
  { href: "/sermons", label: "Sermons" },
  { href: "/testimonies", label: "Testimonies" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-semibold text-neutral-900">
          Spiritual Elevation Ministry
        </Link>

        <nav className="hidden gap-5 text-sm text-neutral-600 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-neutral-900">
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" className="border-t border-neutral-200 px-4 py-3 lg:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
