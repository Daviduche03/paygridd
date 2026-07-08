import { motion } from "framer-motion";
import { LB } from "./landing-border";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.4, delay },
});

const stats = [
  { value: "98%", label: "Auto-match rate", note: "Transfers linked without manual review" },
  { value: "<3s", label: "Webhook latency", note: "From bank event to your system" },
  { value: "₦0", label: "Setup cost", note: "Start collecting on day one" },
  { value: "24/7", label: "Reconciliation", note: "Runs while your team sleeps" },
];

export function LandingStats() {
  return (
    <section id="stats" className={`border-t ${LB.section} py-20 md:py-28`}>
      <div className="mx-auto max-w-6xl px-6">
        <motion.p {...fade()} className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          By the numbers
        </motion.p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              {...fade(index * 0.06)}
              className={`rounded-2xl border ${LB.card} bg-card p-6 md:p-7`}
            >
              <p className="font-serif text-4xl tracking-tight md:text-5xl">{stat.value}</p>
              <p className="mt-3 text-sm font-medium">{stat.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.note}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}