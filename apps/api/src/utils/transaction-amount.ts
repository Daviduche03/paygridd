import { sql } from "drizzle-orm";
import { transactions } from "@/db/schema";

/** Net amount after fees; falls back for legacy rows where net_amount was defaulted to 0. */
export const effectiveNetAmountSql = sql`case
  when ${transactions.netAmount}::numeric > 0
    then ${transactions.netAmount}::numeric
  else ${transactions.amount}::numeric - coalesce(${transactions.platformFee}, 0)::numeric
end`;

export const effectiveNetAmountSubquerySql = sql`case
  when t.net_amount::numeric > 0 then t.net_amount::numeric
  else t.amount::numeric - coalesce(t.platform_fee, 0)::numeric
end`;