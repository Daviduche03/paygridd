import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { LB } from "./landing-border";

const links = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Use cases", href: "#use-cases" },
    { label: "Dashboard", to: "/login" },
  ],
  Resources: [
    { label: "FAQ", href: "#faq" },
    { label: "Documentation", href: "/docs" },
    { label: "API reference", href: "/docs" },
    { label: "Sign in", to: "/login" },
  ],
};

export function LandingFooter() {
  return (
    <footer className={`border-t ${LB.section}`}>
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link to="/" className="inline-block transition-opacity hover:opacity-80">
              <img src="/images/logo.png" alt="PayGrid" className="h-7 w-auto" />
            </Link>
            <p className="mt-6 max-w-sm font-serif text-xl leading-snug tracking-tight text-foreground md:text-2xl">
              Payments infrastructure for teams who've moved past Excel.
            </p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Nigeria · NGN · Nomba rails
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-2 md:justify-end md:gap-16 md:pl-12">
            {Object.entries(links).map(([group, items]) => (
              <div key={group}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {group}
                </p>
                <ul className="mt-4 space-y-3">
                  {items.map((item) => (
                    <li key={item.label}>
                      {"to" in item ? (
                        <Link
                          to={item.to}
                          className="group inline-flex items-center gap-1 text-sm text-foreground/80 transition-colors hover:text-foreground"
                        >
                          {item.label}
                          <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          className="group inline-flex items-center gap-1 text-sm text-foreground/80 transition-colors hover:text-foreground"
                        >
                          {item.label}
                          <ArrowUpRight className="size-3 opacity-0 transition-opacity group-hover:opacity-60" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div
          className={`mt-14 flex flex-col gap-3 border-t ${LB.section} pt-8 sm:flex-row sm:items-center sm:justify-between`}
        >
          <p className="font-mono text-[11px] text-muted-foreground">
            © {new Date().getFullYear()} PayGrid
          </p>
          <p className="font-mono text-[11px] text-muted-foreground">paygrid.xyz</p>
        </div>
      </div>
    </footer>
  );
}