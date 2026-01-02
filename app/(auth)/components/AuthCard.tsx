'use client';

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type AuthCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

const CTA_LINKS = [
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Create account" },
  { href: "/forgot-password", label: "Reset password" },
];

export function AuthCard({ title, description, children }: AuthCardProps) {
  const pathname = usePathname();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-primary/5 dark:bg-dark-surface dark:border-dark-border">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        {description ? <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p> : null}
      </header>

      <div className="space-y-6">{children}</div>

      <nav className="mt-8 grid gap-2 text-sm text-gray-600 dark:text-gray-400">
        {CTA_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center justify-between rounded-lg border border-dashed border-gray-200 px-4 py-3 transition dark:border-dark-border",
              pathname === link.href
                ? "border-primary bg-primary/5 text-primary dark:bg-primary/10 dark:text-primary-400"
                : "hover:border-primary/60 dark:hover:border-primary/40 dark:hover:bg-dark-elevated"
            )}
          >
            {link.label}
            <span aria-hidden className="text-xs text-gray-400">
              →
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

