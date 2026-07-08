import { motion } from "framer-motion";
import { LB } from "./landing-border";
import {
  FlowReceiveIllustration,
  FlowSendIllustration,
  FlowSettleIllustration,
} from "./landing-illustrations";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.45, delay },
});

const steps = [
  {
    label: "01",
    title: "Issue",
    description: "Create an invoice or assign a static virtual account to a customer.",
    Illustration: FlowSendIllustration,
  },
  {
    label: "02",
    title: "Receive",
    description: "They pay by bank transfer. PayGrid picks it up and routes it to the right record.",
    Illustration: FlowReceiveIllustration,
  },
  {
    label: "03",
    title: "Settle",
    description: "Matched, netted after fees, and ready to move to your settlement account.",
    Illustration: FlowSettleIllustration,
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div {...fade()} className="mb-14 md:mb-16">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Flow</p>
          <h2 className="mt-3 max-w-lg font-serif text-3xl leading-tight tracking-tight md:text-5xl">
            Three steps, zero spreadsheets
          </h2>
        </motion.div>

        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.label}
              {...fade(index * 0.08)}
              className={`relative overflow-hidden rounded-2xl border ${LB.card} bg-card`}
            >
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-b from-foreground/[0.03] to-transparent"
                aria-hidden
              />
              <div className="relative flex flex-col p-6 md:p-7">
                <span className="font-mono text-xs text-muted-foreground">{step.label}</span>
                <step.Illustration className="my-6 h-32 w-full text-foreground" />
                <h3 className="font-serif text-xl tracking-tight md:text-2xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}