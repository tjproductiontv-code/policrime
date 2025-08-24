// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`block rounded px-3 py-2 hover:bg-gray-50 ${
        active ? "bg-gray-100 font-medium" : ""
      }`}
    >
      {children}
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 border-r bg-white">
      <div className="p-4">
        <h1 className="text-xl font-bold">PoliPower</h1>
      </div>
      <nav className="px-2 space-y-1">
        <NavItem href="/">Dashboard</NavItem>
        <NavItem href="/earn">Geld verdienen</NavItem>
        <NavItem href="/ranking">Ranking</NavItem>
        <NavItem href="/votes">Stemmen kopen</NavItem>
        <NavItem href="/privileges">Privileges</NavItem>
        <NavItem href="/kantoor">Kantoor</NavItem>


        {/* ⬇️ Nieuwe items */}
        <div className="mt-2 pt-2 border-t text-xs uppercase text-gray-500 px-3">Dossiers</div>
        <NavItem href="/dossiers">Dossiers kopen</NavItem>
        <NavItem href="/dossiers/use">Dossiers gebruiken</NavItem>
      </nav>
    </aside>
  );
}
