-- Set default platform charge rate on businesses that were created before fees were configured.
UPDATE businesses
SET platform_charge_rate = 1.5
WHERE platform_charge_rate::numeric = 0;

-- Backfill platform fees on existing credit transactions where fee was not applied.
-- Uses each business's platform_charge_rate, falling back to 1.5% when unset.
UPDATE transactions t
SET
  platform_fee = ROUND(
    (
      t.amount::numeric
      * COALESCE(NULLIF(b.platform_charge_rate::numeric, 0), 1.5)
      / 100
    ),
    2
  ),
  net_amount = t.amount::numeric - ROUND(
    (
      t.amount::numeric
      * COALESCE(NULLIF(b.platform_charge_rate::numeric, 0), 1.5)
      / 100
    ),
    2
  )
FROM businesses b
WHERE t.business_id = b.id
  AND t.type = 'credit'
  AND t.amount::numeric > 0
  AND (
    t.platform_fee::numeric = 0
    OR t.net_amount::numeric = t.amount::numeric
  );