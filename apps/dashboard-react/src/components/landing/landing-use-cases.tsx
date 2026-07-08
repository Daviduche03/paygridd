import { motion } from "framer-motion";
import { LB } from "./landing-border";
import {
  AgencyIllustration,
  FinanceIllustration,
  SaasIllustration,
} from "./landing-illustrations";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.45, delay },
});

const cases = [
  {
    label: "Agencies",
    title: "Retainers without the chase",
    description:
      "Send monthly invoices with dedicated accounts. Clients pay by transfer — you see it matched before standup.",
    Illustration: AgencyIllustration,
    accent: "from-foreground/[0.04] to-transparent",
  },
  {
    label: "SaaS & subscriptions",
    title: "Billing that survives bank transfers",
    description:
      "Static virtual accounts for each subscriber. Renewals reconcile themselves when the transfer hits.",
    Illustration: SaasIllustration,
    accent: "from-foreground/[0.04] to-transparent",
  },
  {
    label: "Finance teams",
    title: "Close the books faster",
    description:
      "One ledger for collections, fees, and payouts. Export when auditors ask — not every Thursday.",
    Illustration: FinanceIllustration,
    accent: "from-foreground/[0.04] to-transparent",
  },
];

export function LandingUseCases() {
  return (
    <section id="use-cases" className="py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...fade()} className="mb-14 md:mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Built for</p>
          <h2 className="mt-3 max-w-lg font-serif text-3xl leading-tight tracking-tight md:text-5xl">
            Teams that collect in naira, not card rails
          </h2>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-3">
          {cases.map((item, index) => (
            <motion.div
              key={item.label}
              {...fade(index * 0.08)}
              className={`group relative overflow-hidden rounded-2xl border ${LB.card} bg-card min-h-[300px]`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent}`}
                aria-hidden
              />
              <div className="relative flex h-full flex-col p-6 md:p-7">
                <item.Illustration className="mb-auto h-28 w-full text-foreground" />
                <div className="mt-6">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </p>
                  <h3 className="mt-2 font-serif text-xl tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}