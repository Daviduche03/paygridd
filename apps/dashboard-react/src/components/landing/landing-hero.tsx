import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "ui/button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-foreground/[0.03] blur-3xl" />
        <div className="absolute -left-32 top-32 h-72 w-72 animate-first rounded-full bg-foreground/[0.04] blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 animate-second rounded-full bg-foreground/[0.03] blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
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
            <Button size="lg" variant="outline" className="h-11 px-6" asChild>
              <a href="/docs">Read the docs</a>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="rounded-xl border border-border bg-card p-1 shadow-2xl shadow-black/5">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
              <div className="size-2.5 rounded-full bg-border" />
              <div className="size-2.5 rounded-full bg-border" />
              <div className="size-2.5 rounded-full bg-border" />
              <span className="ml-2 text-xs text-muted-foreground">app.paygrid.xyz</span>
            </div>
            <div className="grid gap-px bg-border md:grid-cols-[200px_1fr]">
              <div className="hidden bg-muted/30 p-4 md:block">
                <div className="space-y-2">
                  {["Overview", "Transactions", "Invoices", "Virtual Accounts", "Customers"].map(
                    (item, i) => (
                      <div
                        key={item}
                        className={`rounded-md px-2.5 py-1.5 text-xs ${i === 0 ? "bg-background font-medium" : "text-muted-foreground"}`}
                      >
                        {item}
                      </div>
                    ),
                  )}
                </div>
              </div>
              <div className="bg-background p-5 md:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total balance</p>
                    <p className="font-serif text-2xl">₦4,280,500.00</p>
                  </div>
                  <div className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground">
                    12 matched today
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Open invoices", value: "₦1.2M" },
                    { label: "Pending review", value: "3" },
                    { label: "Active accounts", value: "48" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="mt-1 text-sm font-medium">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    ["TXN-4821", "Ada Ventures", "₦250,000", "Matched"],
                    ["TXN-4820", "Promise Ltd", "₦85,000", "Pending"],
                    ["TXN-4819", "Kora Studio", "₦1,100,000", "Matched"],
                  ].map(([ref, customer, amount, status]) => (
                    <div
                      key={ref}
                      className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-xs"
                    >
                      <span className="font-mono text-muted-foreground">{ref}</span>
                      <span className="hidden sm:inline">{customer}</span>
                      <span className="font-medium">{amount}</span>
                      <span className="text-muted-foreground">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}