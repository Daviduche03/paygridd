import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "ui/button";

export function LandingCta() {
  return (
    <section className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-2xl border border-border bg-card px-8 py-14 text-center md:px-16">
          <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
            Ready to run payments on autopilot?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Join businesses using PayGrid to collect, reconcile, and pay out — without the chaos.
          </p>
          <Button size="lg" className="mt-8 h-11 px-6" asChild>
            <Link to="/login">
              Get started free
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}