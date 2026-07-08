import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  FileText,
  Landmark,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "Invoices that collect",
    description:
      "Create branded invoices with dedicated virtual accounts. Customers pay directly — you get notified instantly.",
  },
  {
    icon: Landmark,
    title: "Virtual accounts",
    description:
      "Provision static or dynamic accounts per customer via Nomba. Every payment maps to the right person automatically.",
  },
  {
    icon: ArrowLeftRight,
    title: "Smart reconciliation",
    description:
      "Match incoming transfers to invoices in real time. Flag underpayments, overpayments, and duplicates without spreadsheets.",
  },
  {
    icon: Wallet,
    title: "Payouts on your terms",
    description:
      "See your net balance after platform fees and withdraw to your settlement bank account when you're ready.",
  },
  {
    icon: Users,
    title: "Customer management",
    description:
      "Keep billing contacts, virtual accounts, and payment history tied to each customer in one place.",
  },
  {
    icon: ShieldCheck,
    title: "Developer-ready",
    description:
      "API keys, webhooks, and scoped access for your engineering team. Integrate PayGrid into your own workflows.",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="border-t border-border py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm text-muted-foreground">Features</p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            Everything you need to get paid and stay reconciled
          </h2>
          <p className="mt-4 text-muted-foreground">
            PayGrid replaces the patchwork of bank alerts, spreadsheets, and manual matching
            with a single system built for Nigerian payment rails.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              className="group rounded-xl border border-border bg-card p-6 transition-colors hover:bg-muted/30"
            >
              <div className="mb-4 flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                <feature.icon className="size-4 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}