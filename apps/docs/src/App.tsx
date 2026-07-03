import { Routes, Route, Navigate, NavLink, useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";

const docs = import.meta.glob("./docs/**/*.mdx", { eager: true }) as Record<
  string,
  { default: React.ComponentType }
>;

type DocEntry = {
  path: string;
  slug: string;
  title: string;
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
    return { path: `/docs/${slug}`, slug, title, Component: mod.default };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

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
    <article className="prose max-w-3xl">
      <entry.Component />
    </article>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setDark(document.documentElement.classList.contains("dark"));
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
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
      className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground"
      aria-label="Toggle theme"
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function Sidebar() {
  const groups = useMemo(() => {
    const map = new Map<string, DocEntry[]>();
    for (const entry of docEntries) {
      const group = entry.slug.includes("/")
        ? entry.slug.split("/")[0]
        : "Getting Started";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(entry);
    }
    return Array.from(map.entries());
  }, []);

  return (
    <aside className="w-64 shrink-0 border-r border-border h-screen overflow-y-auto p-4 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-bold">PayGrid Docs</div>
        <ThemeToggle />
      </div>
      <nav className="space-y-6 flex-1">
        {groups.map(([group, entries]) => (
          <div key={group}>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {group}
            </div>
            <div className="space-y-1">
              {entries.map((entry) => (
                <NavLink
                  key={entry.slug}
                  to={entry.path}
                  className={({ isActive }) =>
                    `block text-sm px-2 py-1 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`
                  }
                >
                  {entry.title}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/docs/*" element={<DocPage />} />
          <Route path="*" element={<Navigate to="/docs/index" replace />} />
        </Routes>
      </main>
    </div>
  );
}
