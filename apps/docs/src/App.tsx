import { Routes, Route, Navigate, NavLink, useParams, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect, useCallback } from "react";
import { Menu, Search, Moon, Sun, FileText, BookOpen, Terminal, Webhook, CreditCard, X, ChevronRight } from "lucide-react";

const docs = import.meta.glob("./docs/**/*.mdx", { eager: true }) as Record<
  string,
  { default: React.ComponentType }
>;

type DocEntry = {
  slug: string;
  title: string;
  label: string;
  Component: React.ComponentType;
};

const docEntries: DocEntry[] = Object.entries(docs)
  .map(([filepath, mod]) => {
    const slug = filepath.replace("./docs/", "").replace(/\.mdx$/, "");
    const title = slug
      .split("/")
      .pop()!
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const label = title === "Index" ? "Overview" : title;
    return { slug, title, label, Component: mod.default };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

const iconMap: Record<string, React.ReactNode> = {
  index: <BookOpen size={16} />,
  "getting-started": <Terminal size={16} />,
  "virtual-accounts": <CreditCard size={16} />,
  webhooks: <Webhook size={16} />,
  "api-reference": <FileText size={16} />,
};

function DocPage() {
  const { "*": splat } = useParams();
  const slug = splat || "index";
  const entry = docEntries.find((e) => e.slug === slug);

  if (!entry) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Page not found
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <span>Docs</span>
        <ChevronRight size={14} />
        <span className="text-foreground">{entry.label}</span>
      </div>
      <article className="prose">
        <entry.Component />
      </article>
    </div>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}

function SearchModal({ onSelect }: { onSelect: (slug: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return docEntries.filter((e) =>
      e.title.toLowerCase().includes(query.toLowerCase()),
    );
  }, [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 border border-border rounded-md text-xs text-muted-foreground hover:bg-accent transition-colors w-full max-w-[240px]"
      >
        <Search size={12} />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5 leading-none">
          ⌘K
        </kbd>
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
          onClick={() => { setOpen(false); setQuery(""); }}
        >
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-[480px] bg-background border border-border rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3 h-11 border-b border-border">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                placeholder="Search documentation..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                onClick={() => { setOpen(false); setQuery(""); }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-1.5">
              {results.length === 0 && query.trim() && (
                <div className="text-sm text-muted-foreground px-2 py-6 text-center">
                  No results
                </div>
              )}
              {results.map((entry) => (
                <button
                  key={entry.slug}
                  onClick={() => { onSelect(entry.slug); setOpen(false); setQuery(""); }}
                  className="flex items-center gap-2.5 w-full px-2.5 py-2 text-sm rounded-md hover:bg-accent transition-colors text-left"
                >
                  <span className="text-muted-foreground shrink-0">
                    {iconMap[entry.slug] || <FileText size={14} />}
                  </span>
                  <span>{entry.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MobileMenu({ onNavigate }: { onNavigate: (slug: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent transition-colors text-muted-foreground"
      >
        <Menu size={16} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[80] flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-[260px] bg-background border-r border-border h-full flex flex-col">
            <div className="flex items-center h-14 px-4 border-b border-border">
              <img src="/images/logo.png" alt="PayGrid" className="h-7 w-auto" />
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {docEntries.map((entry) => (
                <NavLink
                  key={entry.slug}
                  to={`/docs/${entry.slug}`}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 h-9 px-2.5 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-accent text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    }`
                  }
                >
                  <span className="shrink-0 text-muted-foreground">
                    {iconMap[entry.slug] || <FileText size={14} />}
                  </span>
                  {entry.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-background overflow-y-auto hidden md:block"
      style={{ height: "calc(100vh - 49px)", position: "sticky", top: "49px" }}
    >
      <nav className="py-4 px-2 space-y-0.5">
        {docEntries.map((entry) => (
          <NavLink
            key={entry.slug}
            to={`/docs/${entry.slug}`}
            className={({ isActive }) =>
              `flex items-center gap-2.5 h-8 px-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              }`
            }
          >
            <span className="shrink-0 text-muted-foreground">
              {iconMap[entry.slug] || <FileText size={14} />}
            </span>
            {entry.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

function HomePage() {
  const navigate = useNavigate();

  const cards = [
    {
      icon: <Terminal size={18} />,
      title: "Getting Started",
      desc: "Set up your account, authenticate, and make your first API call.",
      slug: "getting-started",
    },
    {
      icon: <CreditCard size={18} />,
      title: "Virtual Accounts",
      desc: "Create and manage static and dynamic virtual accounts.",
      slug: "virtual-accounts",
    },
    {
      icon: <Webhook size={18} />,
      title: "Webhooks",
      desc: "Receive and verify real-time payment notifications.",
      slug: "webhooks",
    },
    {
      icon: <FileText size={18} />,
      title: "API Reference",
      desc: "Complete endpoint reference for the PayGrid API.",
      slug: "api-reference",
    },
  ];

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          PayGrid Documentation
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          PayGrid is a payment management platform for Nigerian businesses.
          Use our API to create virtual accounts, process transactions,
          handle webhooks, and manage KYC verification.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-10">
        {cards.map((card) => (
          <button
            key={card.slug}
            onClick={() => navigate(`/docs/${card.slug}`)}
            className="border border-border rounded-lg p-4 text-left hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-foreground">{card.icon}</span>
              <span className="text-sm font-medium">{card.title}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {card.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="border border-border rounded-lg p-5">
        <div className="flex items-center gap-2.5 mb-3">
          <Terminal size={16} />
          <span className="text-sm font-medium">Quick Example</span>
        </div>
        <pre className="text-sm leading-relaxed text-muted-foreground overflow-x-auto">
          <code>{`curl -X POST https://api.paygrid.xyz/v1/accounts/virtual \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accountRef": "cust-123",
    "accountName": "Acme Inc"
  }'`}</code>
        </pre>
      </div>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const handleSearchSelect = useCallback(
    (slug: string) => navigate(`/docs/${slug}`),
    [navigate],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 h-12 border-b border-border bg-background flex items-center px-4 gap-3">
        <a href="/docs" className="flex items-center gap-2 shrink-0">
          <img src="/images/logo.png" alt="PayGrid" className="h-6 w-auto" />
          <span className="text-sm font-semibold hidden sm:inline">PayGrid</span>
        </a>
        <div className="hidden sm:block">
          <SearchModal onSelect={handleSearchSelect} />
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <ThemeToggle />
        </div>
        <MobileMenu onNavigate={handleSearchSelect} />
      </header>

      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-w-0 px-6 py-10 md:px-10">
          <Routes>
            <Route path="/docs/index" element={<HomePage />} />
            <Route path="/docs/*" element={<DocPage />} />
            <Route path="*" element={<Navigate to="/docs/index" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
