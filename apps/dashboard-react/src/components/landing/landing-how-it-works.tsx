import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LB } from "./landing-border";

const moments = [
  {
    label: "Send",
    title: "Issue an invoice or assign an account",
    detail: "Share a payment link with a dedicated virtual account baked in. No chasing bank details.",
    panel: (
      <div className={`rounded-lg border ${LB.inner} bg-background p-4`}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-muted-foreground">INV-2048</span>
          <span className="text-muted-foreground">sent 2m ago</span>
        </div>
        <p className="mt-3 font-serif text-xl">₦1,450,000</p>
        <p className="mt-1 text-sm text-muted-foreground">Ada Ventures</p>
        <div
          className={`mt-4 rounded border border-dashed ${LB.inner} px-3 py-2 font-mono text-[11px] text-muted-foreground`}
        >
          9034567891 · Wema Bank
        </div>
      </div>
    ),
  },
  {
    label: "Receive",
    title: "Customer pays via bank transfer",
    detail: "Nomba routes the transfer to the right virtual account. PayGrid picks it up in seconds.",
    panel: (
      <div className={`rounded-lg border ${LB.inner} bg-background p-4`}>
        <div className="flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
            incoming transfer
          </span>
        </div>
        <div className="mt-4 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-mono font-medium">₦1,450,000.00</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sender</span>
            <span>ADA VENTURES LTD</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono">INV2048 MAR</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    label: "Settle",
    title: "Matched, netted, ready to withdraw",
    detail: "Platform fees are deducted upfront. You see the real number and move it to your bank.",
    panel: (
      <div className={`rounded-lg border ${LB.inner} bg-background p-4`}>
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] text-muted-foreground">TXN-4821</span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
            matched
          </span>
        </div>
        <p className="mt-4 font-serif text-xl">₦1,411,750</p>
        <p className="mt-1 text-xs text-muted-foreground">net after fees</p>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>INV-2048</span>
          <ArrowRight className="size-3" />
          <span>payout queue</span>
        </div>
      </div>
    ),
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className={`border-t ${LB.section} py-24 md:py-36`}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mb-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
        >
          <div className="max-w-lg">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              The flow
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight md:text-[2.75rem]">
              From invoice to cleared balance — no spreadsheet in between
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground md:text-right">
            Most teams stitch together bank alerts, WhatsApp screenshots, and Excel. PayGrid closes
            the loop in one pass.
          </p>
        </motion.div>

        <div className="relative">
          <div className={`absolute left-4 top-0 hidden h-full w-px ${LB.split} md:left-1/2 md:block md:-translate-x-px`} />

          <div className="space-y-16 md:space-y-24">
            {moments.map((moment, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={moment.label}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className={`relative grid items-center gap-8 md:grid-cols-2 md:gap-16 ${
                    isEven ? "" : "md:[&>div:first-child]:order-2"
                  }`}
                >
                  <div className={isEven ? "md:pr-8 md:text-right" : "md:pl-8"}>
                    <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      {moment.label}
                    </span>
                    <h3 className="mt-3 font-serif text-2xl tracking-tight">{moment.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {moment.detail}
                    </p>
                  </div>

                  <div className="relative md:px-6">
                    <div
                      className={`absolute top-8 hidden size-2 rounded-full border-2 border-background bg-foreground md:block md:top-1/2 md:-translate-y-1/2 ${
                        isEven ? "md:-left-1" : "md:-right-1"
                      }`}
                    />
                    <div className={`rounded-xl border ${LB.card} bg-card p-1`}>
                      {moment.panel}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}