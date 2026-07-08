import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="PayGrid" className="h-6 w-auto opacity-80" />
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} PayGrid
          </span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <a href="/docs" className="transition-colors hover:text-foreground">
            Documentation
          </a>
          <Link to="/login" className="transition-colors hover:text-foreground">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}