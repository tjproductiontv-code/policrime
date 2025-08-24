// components/Sidebar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const active = pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`block rounded px-3 py-2 hover:bg-gray-50 ${
        active ? "bg-gray-100 font-medium text-gray-900" : "text-gray-700"
      }`}
    >
      {children}
    </Link>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 pt-3 border-t px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
      {children}
    </div>
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

        <SectionTitle>Kantoor</SectionTitle>
        <NavItem href="/kantoor/onderzoek">Onderzoek</NavItem>
        <NavItem href="/kantoor/personeel">Personeel</NavItem>

        <SectionTitle>Dossiers</SectionTitle>
        <NavItem href="/dossiers">Dossiers kopen</NavItem>
        <NavItem href="/dossiers/use">Dossiers gebruiken</NavItem>
      </nav>
    </aside>
  );
}
