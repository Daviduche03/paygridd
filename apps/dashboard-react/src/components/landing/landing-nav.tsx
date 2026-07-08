import { Link } from "react-router-dom";
import { Button } from "ui/button";
import { LB } from "./landing-border";

export function LandingNav() {
  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 border-b ${LB.section} bg-background/80 backdrop-blur-xl`}
    >
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <img src="/images/logo.png" alt="PayGrid" className="h-8 w-auto" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            How it works
          </a>
          <a
            href="/docs"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Docs
          </a>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/login">Get started</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}