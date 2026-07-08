import { Link } from "react-router-dom";
import { LB } from "./landing-border";

export function LandingFooter() {
  return (
    <footer className={`border-t ${LB.section}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/logo.png" alt="PayGrid" className="h-5 w-auto opacity-70" />
          <span className="font-mono text-[11px] text-muted-foreground">
            payments for nigerian teams
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground">
          <a href="/docs" className="transition-colors hover:text-foreground">
            docs
          </a>
          <Link to="/login" className="transition-colors hover:text-foreground">
            sign in
          </Link>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}