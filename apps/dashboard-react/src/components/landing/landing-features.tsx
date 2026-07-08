import { motion } from "framer-motion";
import { LB } from "./landing-border";
import {
  ApiIllustration,
  InvoiceIllustration,
  PayoutIllustration,
  ReconciliationIllustration,
  VirtualAccountIllustration,
} from "./landing-illustrations";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.45, delay },
});

const tiles = [
  {
    id: "invoice",
    span: "md:col-span-7",
    minH: "min-h-[340px]",
    label: "Invoices",
    title: "Send a bill, get a bank account",
    description:
      "Every invoice includes a dedicated virtual account. Customers pay by transfer — you get notified when it lands.",
    Illustration: InvoiceIllustration,
    accent: "from-emerald-500/[0.07] to-transparent",
  },
  {
    id: "accounts",
    span: "md:col-span-5",
    minH: "min-h-[200px]",
    label: "Virtual accounts",
    title: "One number per customer",
    description: "Static accounts for repeat payers. No confusion about who sent what.",
    Illustration: VirtualAccountIllustration,
    accent: "from-foreground/[0.04] to-transparent",
  },
  {
    id: "reconcile",
    span: "md:col-span-4",
    minH: "min-h-[220px]",
    label: "Reconciliation",
    title: "Matched on arrival",
    description: "Transfers tie to invoices automatically. Only exceptions need your attention.",
    Illustration: ReconciliationIllustration,
    accent: "from-emerald-500/[0.06] to-transparent",
  },
  {
    id: "payout",
    span: "md:col-span-4",
    minH: "min-h-[220px]",
    label: "Payouts",
    title: "Withdraw what's actually yours",
    description: "Fees deducted upfront. Your balance is the real number.",
    Illustration: PayoutIllustration,
    accent: "from-foreground/[0.04] to-transparent",
  },
  {
    id: "api",
    span: "md:col-span-4",
    minH: "min-h-[220px]",
    label: "Developers",
    title: "APIs & webhooks",
    description: "Integrate when you're ready. Keys, events, and docs included.",
    Illustration: ApiIllustration,
    accent: "from-foreground/[0.03] to-transparent",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className={`border-t ${LB.section} py-28 md:py-40`}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...fade()} className="mb-14 flex flex-col gap-8 md:mb-16 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Product</p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl leading-tight tracking-tight md:text-5xl">
              Everything between invoice and payout
            </h2>
          </div>
          <p className="max-w-xs text-sm text-muted-foreground md:text-right">
            Built on Nomba rails. Designed for Nigerian finance teams who've outgrown spreadsheets.
          </p>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-12 md:auto-rows-fr">
          {tiles.map((tile, index) => (
            <motion.div
              key={tile.id}
              {...fade(index * 0.06)}
              className={`group relative overflow-hidden rounded-2xl border ${LB.card} bg-card ${tile.span} ${tile.minH}`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tile.accent}`}
                aria-hidden
              />
              <div className="relative flex h-full flex-col p-6 md:p-7">
                <tile.Illustration className="mb-auto h-28 w-full text-foreground md:h-32 md:max-w-[85%]" />
                <div className="mt-6">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {tile.label}
                  </p>
                  <h3 className="mt-2 font-serif text-lg tracking-tight md:text-xl">{tile.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tile.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}