"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Odún del día" },
  { href: "/registro", label: "Registro" },
];

export function Navbar() {
  const path = usePathname();
  return (
    <header className="border-b border-[#EADBCE] bg-[#FAF7F2]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-xl text-[#241B16]">
          Odú Ifá
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {LINKS.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "text-[#241B16]" : "text-[#6D5E52]"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-[#EADBCE] bg-[#FAF7F2]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[#6D5E52]">
        <p>
          Notas de estudio de DAFA. No sustituyen versos, linaje ni iniciación. Ifá se presenta como tradición,
          no como ciencia verificada.
        </p>
      </div>
    </footer>
  );
}
