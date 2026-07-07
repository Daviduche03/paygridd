"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "ui/badge";
import { Button } from "ui/button";
import { Icons } from "ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "ui/table";
import { ChatProvider, useChatState } from "@/components/chat/chat-context";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { filesToUIParts } from "@/components/chat/file-utils";
import { ScrollableContent } from "@/components/scrollable-content";
import { EmptyState } from "@/components/empty-state";
import { KpiCard, KpiGrid, KpiCardLink, SurfaceCard } from "@/components/surface-card";
import { useStableQuery } from "@/hooks/use-stable-query";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";
import { formatAmount, secondsToHoursAndMinutes } from "@/utils/format";
import { WidgetCardsSkeleton } from "./overview-skeleton";
type TransactionRow = {
  id: string;
  name?: string | null;
  description?: string | null;
  amount?: number;
  currency?: string;
  status?: string;
  date?: string;
};

function RecentTransactions() {
  const trpc = useTRPC();
  const { data: user } = useUserQuery();
  const { data, isPending } = useStableQuery({
    ...trpc.transactions.list.queryOptions({ limit: 8 }),
  });

  const transactions = (data ?? []) as TransactionRow[];

  if (isPending && transactions.length === 0) {
    return (
      <SurfaceCard>
        <div className="border-b border-border px-4 py-3">
          <div className="h-5 w-40 animate-pulse bg-muted" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex h-[45px] items-center justify-between border-b border-border px-4 last:border-0"
          >
            <div className="h-3 w-32 animate-pulse bg-muted" />
            <div className="h-3 w-16 animate-pulse bg-muted" />
          </div>
        ))}
      </SurfaceCard>
    );
  }

  if (!transactions.length) {
    return (
      <EmptyState
        className="py-16"
        icon={<Icons.CreateTransaction className="size-5 text-muted-foreground" />}
        title="No transactions yet"
        description="Incoming payments will appear here once customers begin paying into their virtual accounts."
        action={{ label: "View Transactions", href: "/transactions" }}
      />
    );
  }

  return (
    <SurfaceCard>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">Description</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[140px]">Date</TableHead>
            <TableHead className="w-[120px] text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.slice(0, 8).map((tx) => (
            <TableRow key={tx.id} className="h-[45px] hover:bg-muted/50">
              <TableCell className="font-medium truncate max-w-[280px]">
                {tx.name ?? tx.description ?? "Transaction"}
              </TableCell>
              <TableCell>
                <Badge className="bg-muted text-foreground border-transparent">
                  {tx.status ?? "Pending"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {tx.date ?? "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium">
                {formatAmount({
                  amount: tx.amount ?? 0,
                  currency: tx.currency ?? "NGN",
                  locale: user?.locale,
                }) ?? tx.amount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SurfaceCard>
  );
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function WelcomeGreeting() {
  const { data: user } = useUserQuery();
  const [greeting, setGreeting] = useState(getTimeBasedGreeting);

  useEffect(() => {
    setGreeting(getTimeBasedGreeting());
    const interval = setInterval(() => setGreeting(getTimeBasedGreeting()), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const firstName = user?.fullName?.split(" ")[0];

  return (
    <h1 className="text-[38px] font-serif leading-tight">
      {greeting}
      {firstName ? <>, <span className="text-muted-foreground">{firstName}</span></> : null}
    </h1>
  );
}

const linkClass =
  "border-b border-dashed border-[#878787]/30 hover:text-foreground transition-colors";

type Insight = {
  key: string;
  before: string;
  link: string;
  after: string;
  href: string;
};

const TICK_DURATION = 6000;

function SummaryTicker({ insights }: { insights: Insight[] }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (insights.length <= 1) return;
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(elapsed / TICK_DURATION, 1);
      setProgress(pct);
      if (pct >= 1) {
        setIndex((prev) => (prev + 1) % insights.length);
        setProgress(0);
        startRef.current = Date.now();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [insights.length]);

  const current = insights[index % insights.length]!;

  if (insights.length <= 1) {
    return (
      <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
        {current.before}
        {current.link && (
          <Link href={current.href} className={linkClass}>{current.link}</Link>
        )}
        {current.after}
      </p>
    );
  }

  return (
    <div className="flex flex-col mt-1 gap-1">
      <div className="relative h-5 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.key}
            className="absolute inset-0 flex items-center"
            initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-muted-foreground text-sm leading-relaxed">
              {current.before}
              {current.link && (
                <Link href={current.href} className={linkClass}>{current.link}</Link>
              )}
              {current.after}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-1.5">
        {insights.map((insight, i) => (
          <button
            key={insight.key}
            type="button"
            className="group/bar relative cursor-pointer py-1"
            onClick={() => { setIndex(i); setProgress(0); startRef.current = Date.now(); }}
          >
            <div className="relative h-[2px] w-4 rounded-full bg-primary/10 overflow-hidden">
              <div
                className="absolute inset-0 bg-primary/40 rounded-full origin-left group-hover/bar:!scale-x-100"
                style={{ transform: `scaleX(${i === index ? progress : 0})` }}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function WelcomeSummary() {
  const trpc = useTRPC();
  const { data, isPending } = useStableQuery(trpc.overview.summary.queryOptions());

  if (isPending) return <div className="mt-1"><div className="h-[14px] w-[280px] animate-pulse bg-muted rounded" /></div>;
  if (!data) return null;

  const insights: Insight[] = [];

  if (data.openInvoices.count > 0) {
    const amount = formatAmount({ amount: data.openInvoices.totalAmount, currency: data.openInvoices.currency, maximumFractionDigits: 0 });
    insights.push({
      key: "invoices",
      href: `/invoices?statuses=${["draft", "scheduled", "unpaid"].join(",")}`,
      before: "You have ",
      link: `${data.openInvoices.count} ${data.openInvoices.count === 1 ? "invoice" : "invoices"} outstanding`,
      after: `, totaling ${amount}.`,
    });
  }

  if (data.cashBalance.totalBalance > 0) {
    const amount = formatAmount({ amount: data.cashBalance.totalBalance, currency: data.cashBalance.currency, maximumFractionDigits: 0 });
    const suffix = data.cashBalance.accountCount > 1 ? ` across ${data.cashBalance.accountCount} accounts` : "";
    insights.push({
      key: "cash",
      href: "/reports?scrollTo=cash-balance",
      before: "Your ",
      link: "cash balance",
      after: ` sits at ${amount}${suffix}.`,
    });
  }

  if (data.transactionsToReview.count > 0) {
    insights.push({
      key: "transactions",
      href: "/transactions?tab=review",
      before: "You have ",
      link: `${data.transactionsToReview.count} ${data.transactionsToReview.count === 1 ? "transaction" : "transactions"}`,
      after: " ready to review and export.",
    });
  }

  if (insights.length === 0) {
    insights.push({
      key: "clear",
      href: "#",
      before: "",
      link: "",
      after: "You're all caught up. Nothing needs your attention right now.",
    });
  }

  return <SummaryTicker insights={insights} />;
}

const CHAT_ACTIONS = [
  { label: "Create Invoice", icon: Icons.Invoice, message: "Create a new invoice" },
  { label: "Add Transaction", icon: Icons.CreateTransaction, message: "Add a new transaction" },
  { label: "Add Customer", icon: Icons.Customers, message: "Add a new customer" },
  { label: "Track Time", icon: Icons.Tracker, message: "Start tracking time" },
] as const;

const quickButtonClass =
  "flex items-center gap-1.5 border bg-white border-[#e6e6e6] hover:bg-[#f7f7f7] hover:border-[#d0d0d0] dark:border-[#1d1d1d] dark:bg-[#0c0c0c] dark:hover:bg-[#0f0f0f] dark:hover:border-[#222222] px-3 py-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-all duration-300 cursor-pointer group";

const quickIconClass =
  "text-muted-foreground/40 group-hover:text-foreground transition-colors duration-300";

function QuickActions({ onChatOpen }: { onChatOpen: () => void }) {
  const { sendMessage, setMessages, setChatTitle } = useChatState();
  const { openFilePicker } = { openFilePicker: () => {} };

  const handleChatAction = (message: string) => {
    setMessages([]);
    setChatTitle(null);
    sendMessage({ text: message });
    onChatOpen();
  };

  return (
    <div className="flex items-center gap-3 pt-2 pb-12 flex-wrap">
      {CHAT_ACTIONS.map(({ label, icon: Icon, message }) => (
        <button
          key={label}
          type="button"
          className={quickButtonClass}
          onClick={() => handleChatAction(message)}
        >
          <Icon size={13} className={quickIconClass} />
          <span>{label}</span>
        </button>
      ))}
      <button type="button" className={quickButtonClass}>
        <Icons.Inbox2 size={13} className={quickIconClass} />
        <span>Upload Receipt</span>
      </button>
    </div>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const {
    messages,
    sendMessage,
    status,
    stop,
    inputValue,
    setInputValue,
  } = useChatState();
  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = useCallback(
    async (rawFiles?: File[]) => {
      if (!inputValue.trim() && !rawFiles?.length) return;
      if (isStreaming) return;
      const text = inputValue.trim();
      setInputValue("");
      const files = rawFiles?.length
        ? await filesToUIParts(rawFiles)
        : undefined;
      sendMessage({ text: text || "Attached files", files });
    },
    [inputValue, isStreaming, sendMessage, setInputValue],
  );

  return (
    <div className="fixed top-[70px] right-0 z-[65] flex h-[calc(100vh-70px)] w-[420px] flex-col border-l border-border bg-background">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <span className="text-sm font-medium">Assistant</span>
        <Button variant="outline" size="icon" onClick={onClose}>
          <Icons.Close className="size-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <ChatMessages
          messages={messages}
          status={status}
          onInvoiceUpdate={() => {}}
        />
      </div>

      <div className="shrink-0 border-t border-border p-4">
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onStop={stop}
            isStreaming={isStreaming}
            placeholder="How can I help you today?"
            autoFocus
            menuPosition="above"
          />
      </div>
    </div>
  );
}

function SummaryCards() {
  const trpc = useTRPC();
  const { data, isPending } = useStableQuery(trpc.overview.summary.queryOptions());

  if (isPending) {
    return <WidgetCardsSkeleton />;
  }

  if (!data) return null;

  return (
    <KpiGrid className="grid-cols-2 md:grid-cols-4">
      <KpiCardLink
        href="/transactions"
        label="Cash Balance"
        value={formatAmount({ amount: data.cashBalance.totalBalance, currency: data.cashBalance.currency })}
        detail={`${data.cashBalance.accountCount} account${data.cashBalance.accountCount !== 1 ? "s" : ""}`}
      />
      <KpiCardLink
        href="/invoices"
        label="Open Invoices"
        value={data.openInvoices.count}
        detail={formatAmount({ amount: data.openInvoices.totalAmount, currency: data.openInvoices.currency })}
      />
      <KpiCardLink
        href="/customers"
        label="Customers"
        value={data.customers.count}
        detail="Total customers"
      />
      <KpiCardLink
        href="/virtual-accounts"
        label="Virtual Accounts"
        value={data.virtualAccounts.count}
        detail={`${data.virtualAccounts.activeCount} active`}
      />
    </KpiGrid>
  );
}

export function OverviewView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [chatOpen, setChatOpen] = useState(false);

  useLayoutEffect(() => {
    void queryClient.ensureQueryData(trpc.overview.summary.queryOptions());
  }, [queryClient, trpc]);

  return (
    <ChatProvider>
      <ScrollableContent>
        <div className="flex flex-col pb-6">
          <div className="flex items-start justify-between pb-6 pt-6">
            <div>
              <WelcomeGreeting />
              <WelcomeSummary />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/virtual-accounts">
                  <Icons.Add className="size-3.5 mr-1.5" />
                  Provision Account
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={() => setChatOpen((v) => !v)}
              >
                <Icons.AI className="size-4" />
              </Button>
            </div>
          </div>

          <SummaryCards />

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium">Recent Transactions</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Latest activity across all virtual accounts.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/transactions">View all</Link>
              </Button>
            </div>
            <RecentTransactions />
          </div>

          <div className="mb-6">
            <div className="mb-4">
              <h2 className="text-sm font-medium">Quick Actions</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Common tasks and assistant shortcuts.
              </p>
            </div>
            <QuickActions onChatOpen={() => setChatOpen(true)} />
          </div>
        </div>
      </ScrollableContent>

      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </ChatProvider>
  );
}
