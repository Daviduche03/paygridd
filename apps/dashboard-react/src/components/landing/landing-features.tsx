import { motion } from "framer-motion";
import { LB } from "./landing-border";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.45 },
};

export function LandingFeatures() {
  return (
    <section id="features" className={`border-t ${LB.section} py-24 md:py-36`}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...fadeUp} className="mb-16 max-w-xl">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            What you get
          </p>
          <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight md:text-[2.75rem]">
            One surface for every payment that hits your account
          </h2>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-12 md:grid-rows-[auto_auto]">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.05 }}
            className={`overflow-hidden rounded-xl border ${LB.card} bg-card md:col-span-7`}
          >
            <div className={`border-b ${LB.inner} px-5 py-4`}>
              <p className="font-mono text-[11px] text-muted-foreground">invoice / INV-2048</p>
              <h3 className="mt-1 text-sm font-medium">Invoices with built-in collection</h3>
            </div>
            <div className="p-5 md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-serif text-2xl md:text-3xl">₦1,450,000.00</p>
                  <p className="mt-1 text-sm text-muted-foreground">Ada Ventures · Due Mar 14</p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
                  awaiting payment
                </span>
              </div>
              <div className={`mt-6 space-y-2 border-t ${LB.inner} pt-5`}>
                {[
                  ["Design retainer — Q1", "₦950,000"],
                  ["Hosting & infra", "₦500,000"],
                ].map(([label, amount]) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono">{amount}</span>
                  </div>
                ))}
              </div>
              <div
                className={`mt-6 rounded-lg border border-dashed ${LB.inner} bg-muted/20 p-4`}
              >
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Pay to
                </p>
                <p className="mt-2 font-mono text-sm">9034567891 · Wema Bank</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Ada Ventures / INV-2048</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.1 }}
            className={`overflow-hidden rounded-xl border ${LB.card} bg-card md:col-span-5`}
          >
            <div className={`border-b ${LB.inner} px-5 py-4`}>
              <p className="font-mono text-[11px] text-muted-foreground">virtual-account / static</p>
              <h3 className="mt-1 text-sm font-medium">Dedicated accounts per customer</h3>
            </div>
            <div className="p-5 md:p-6">
              <div className="space-y-4">
                {[
                  { name: "Promise Ltd", acct: "8123456789", bank: "Sterling", active: true },
                  { name: "Kora Studio", acct: "7012345678", bank: "FCMB", active: true },
                  { name: "Northline Co", acct: "6098765432", bank: "GTBank", active: false },
                ].map((customer) => (
                  <div
                    key={customer.acct}
                    className={`flex items-center justify-between rounded-md border ${LB.inner} px-3 py-2.5`}
                  >
                    <div>
                      <p className="text-sm">{customer.name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {customer.acct} · {customer.bank}
                      </p>
                    </div>
                    <span
                      className={`size-1.5 rounded-full ${customer.active ? "bg-emerald-500" : LB.dot}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.15 }}
            className={`overflow-hidden rounded-xl border ${LB.card} bg-card md:col-span-8`}
          >
            <div className={`border-b ${LB.inner} px-5 py-4`}>
              <p className="font-mono text-[11px] text-muted-foreground">reconciliation / live</p>
              <h3 className="mt-1 text-sm font-medium">Transfers matched as they land</h3>
            </div>
            <div className={`grid gap-px ${LB.split} md:grid-cols-[1fr_auto]`}>
              <div className="bg-card p-5 md:p-6">
                <div className="space-y-2">
                  {[
                    { ref: "TXN-4821", from: "Ada Ventures", amount: "₦250,000", match: "INV-2048", status: "matched" },
                    { ref: "TXN-4820", from: "Promise Ltd", amount: "₦85,000", match: "—", status: "review" },
                    { ref: "TXN-4819", from: "Kora Studio", amount: "₦1,100,000", match: "INV-2041", status: "matched" },
                  ].map((txn) => (
                    <div
                      key={txn.ref}
                      className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-0.5 rounded-md border ${LB.inner} px-3 py-2.5 text-xs sm:grid-cols-[auto_1fr_auto_auto]`}
                    >
                      <span className="font-mono text-muted-foreground">{txn.ref}</span>
                      <span>{txn.from}</span>
                      <span className="font-mono font-medium">{txn.amount}</span>
                      <span
                        className={
                          txn.status === "matched"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {txn.status === "matched" ? txn.match : "needs review"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hidden bg-muted/20 p-5 md:block md:w-48">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Today
                </p>
                <p className="mt-3 font-serif text-3xl">12</p>
                <p className="text-xs text-muted-foreground">auto-matched</p>
                <div className={`mt-6 border-t ${LB.inner} pt-4`}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Exceptions
                  </p>
                  <p className="mt-2 font-serif text-2xl">3</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.45, delay: 0.2 }}
            className={`overflow-hidden rounded-xl border ${LB.card} bg-card md:col-span-4`}
          >
            <div className={`border-b ${LB.inner} px-5 py-4`}>
              <p className="font-mono text-[11px] text-muted-foreground">payout / settlement</p>
              <h3 className="mt-1 text-sm font-medium">Net balance, on your schedule</h3>
            </div>
            <div className="p-5 md:p-6">
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Available to withdraw
              </p>
              <p className="mt-2 font-serif text-3xl">₦3,842,250</p>
              <div className="mt-5 space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gross collected</span>
                  <span className="font-mono text-foreground">₦4,015,000</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Platform fee</span>
                  <span className="font-mono text-foreground">−₦172,750</span>
                </div>
              </div>
              <div
                className={`mt-5 rounded-md border ${LB.inner} bg-muted/30 px-3 py-2 font-mono text-[11px] text-muted-foreground`}
              >
                → 0123456789 · Access Bank
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}