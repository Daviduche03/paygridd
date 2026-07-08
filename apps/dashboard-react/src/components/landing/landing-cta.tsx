import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "ui/button";
import { LB } from "./landing-border";

export function LandingCta() {
  return (
    <section className={`border-t ${LB.section} py-28 md:py-40`}>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Get started
            </p>
            <h2 className="mt-4 max-w-md font-serif text-3xl leading-tight tracking-tight md:text-5xl">
              Your next transfer shouldn't need a spreadsheet
            </h2>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-11 px-6" asChild>
              <Link to="/login">
                Open dashboard
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" className="h-11 px-6 text-muted-foreground" asChild>
              <a href="/docs">API reference</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}