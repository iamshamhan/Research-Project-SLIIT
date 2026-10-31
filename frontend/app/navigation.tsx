"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const path = usePathname();
  return (
    <nav className="direction-nav" aria-label="Communication direction">
      <Link href="/" aria-current={path === "/" ? "page" : undefined}>
        Patient → Doctor
      </Link>
      <Link
        href="/doctor"
        aria-current={path === "/doctor" ? "page" : undefined}
      >
        Doctor → Patient
      </Link>
    </nav>
  );
}
