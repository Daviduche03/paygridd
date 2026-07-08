import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "ui/accordion";
import { LB } from "./landing-border";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.45, delay },
});

const faqs = [
  {
    q: "What is a virtual account?",
    a: "A dedicated bank account number assigned to your business or a specific customer. When someone transfers to it, PayGrid knows exactly who paid and what it's for.",
  },
  {
    q: "How does reconciliation work?",
    a: "Incoming transfers are matched to invoices or customers using account numbers, amounts, and references. Most payments clear automatically — only edge cases land in your review queue.",
  },
  {
    q: "How are platform fees handled?",
    a: "Fees are deducted when a payment is matched, before it hits your available balance. You always see the net amount you can withdraw.",
  },
  {
    q: "Do I need engineering resources to start?",
    a: "No. You can run everything from the dashboard — invoices, accounts, reconciliation, and payouts. APIs and webhooks are there when you want to automate.",
  },
  {
    q: "Is PayGrid only for Nigerian businesses?",
    a: "Yes. PayGrid is built for NGN collections on Nigerian bank rails via Nomba. If you collect in naira by transfer, you're in the right place.",
  },
];

export function LandingFaq() {
  return (
    <section id="faq" className="py-28 md:py-40">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-12 md:grid-cols-12 md:gap-16">
          <motion.div {...fade()} className="md:col-span-4">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">FAQ</p>
            <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight md:text-4xl">
              Questions before you switch
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Still unsure? Read the docs or open the dashboard — no card required.
            </p>
          </motion.div>

          <motion.div {...fade(0.08)} className="md:col-span-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq) => (
                <AccordionItem
                  key={faq.q}
                  value={faq.q}
                  className={`border-b ${LB.section} border-t-0 border-x-0`}
                >
                  <AccordionTrigger className="py-5 text-left font-serif text-base hover:no-underline md:text-lg">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}