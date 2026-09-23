"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-[#EADBCE] bg-[#FAF7F2]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="font-serif text-xl text-[#241B16]">
          Odú Ifá
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-[#6D5E52]">
          <Link href="/#ekele">Ekele</Link>
          <Link href="/#lectura">Lectura</Link>
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
