const steps = [
  {
    step: "01",
    title: "Create your business",
    description: "Sign in with Google, set up your company, and connect your settlement bank account.",
  },
  {
    step: "02",
    title: "Send invoices or provision accounts",
    description: "Share payment links or assign dedicated virtual accounts to each customer.",
  },
  {
    step: "03",
    title: "Get paid and reconciled",
    description: "Incoming transfers are matched automatically. Review exceptions, then withdraw your net balance.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border bg-muted/20 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm text-muted-foreground">How it works</p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            From invoice to payout in three steps
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((item) => (
            <div key={item.step} className="relative">
              <span className="font-mono text-xs text-muted-foreground">{item.step}</span>
              <h3 className="mt-3 text-base font-medium">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}