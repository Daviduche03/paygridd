import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "ui/button";
import { LB } from "./landing-border";

const HERO_IMAGE = "/images/hero.jpg";

export function LandingHero() {
  return (
    <section className="relative min-h-[92vh] overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat brightness-[0.35] saturate-[0.8]"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
        aria-hidden
      />

      <div className="absolute inset-0 bg-background/60" aria-hidden />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_42%,hsl(var(--background)/0.98),hsl(var(--background)/0.82)_55%,hsl(var(--background)/0.35)_100%)]"
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 via-background/20 to-background" aria-hidden />

      <div className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-center px-6 pb-24 pt-32 md:pb-32 md:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div
            className={`mb-6 inline-flex items-center gap-2 rounded-full border ${LB.inner} bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm`}
          >
            <span className="size-1.5 rounded-full bg-foreground/70" />
            Built for Nigerian businesses
          </div>

          <h1 className="font-serif text-4xl leading-[1.1] tracking-tight md:text-6xl lg:text-7xl">
            Payments infrastructure
            <br />
            <span className="text-muted-foreground">for modern finance teams</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Issue invoices, provision virtual accounts, reconcile incoming transfers,
            and pay out — all from one calm, focused dashboard.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-11 px-6" asChild>
              <Link to="/login">
                Start for free
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-11 border-background/80 bg-background/50 px-6 backdrop-blur-sm"
              asChild
            >
              <a href="/docs">Read the docs</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}