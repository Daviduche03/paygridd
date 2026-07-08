"use client";

import { motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";

const highlights = [
  {
    title: "Payments matched automatically",
    description:
      "Incoming transfers to your virtual accounts are linked to the right customer and invoice.",
  },
  {
    title: "Over- and under-payments flagged",
    description:
      "PayGrid highlights discrepancies so you can resolve them from the reconciliation queue.",
  },
  {
    title: "Ready when you are",
    description:
      "Review matches in the dashboard, or let PayGrid handle routine reconciliation in the background.",
  },
];

export function ReconciliationStep() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex size-12 items-center justify-center border border-border bg-secondary"
      >
        <GitCompareArrows className="size-5 text-foreground" />
      </motion.div>

      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-lg lg:text-xl font-serif"
        >
          Automatic reconciliation
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          PayGrid matches every payment to the right invoice so your books stay
          up to date without manual work.
        </motion.p>
      </div>

      <motion.ul
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
        className="space-y-4"
      >
        {highlights.map((item, index) => (
          <motion.li
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 + index * 0.08 }}
            className="border border-border bg-secondary/40 p-4"
          >
            <p className="text-sm font-medium">{item.title}</p>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {item.description}
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}