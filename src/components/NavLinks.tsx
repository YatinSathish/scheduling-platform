"use client";

import { usePathname } from "next/navigation";

const links = [
  { href: "/manager", label: "Manager" },
  { href: "/technician", label: "Technician" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center bg-gray-200 rounded-full p-1 gap-0.5">
      {links.map(({ href, label }) => {
        const active = pathname.startsWith(href);
        return (
          <a
            key={href}
            href={href}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              active
                ? "bg-brand-primary text-white shadow-sm"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
