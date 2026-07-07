const NOMBA_BASE = process.env.NOMBA_SANDBOX === "true"
  ? "https://api.sandbox.nomba.com"
  : "https://api.nomba.com";

const HEADERS = {
  "Content-Type": "application/json",
  accountId: process.env.NOMBA_ACCOUNT_ID!,
};

async function getAccessToken() {
  const res = await fetch(`${NOMBA_BASE}/v1/auth/token/issue`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      client_id: process.env.NOMBA_CLIENT_ID,
      client_secret: process.env.NOMBA_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`);
  const data: any = await res.json();
  return data.access_token;
}

async function getParentAccountBalance() {
  const token = await getAccessToken();
  const res = await fetch(`${NOMBA_BASE}/v1/transactions/bank?limit=1`, {
    headers: { ...HEADERS, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Failed: ${res.status} ${await res.text()}`);
  const data: any = await res.json();
  const latest = data.results?.[0];
  if (latest) {
    console.log(`Balance: ${latest.walletBalance} ${latest.currency ?? "NGN"}`);
    console.log(`Available Balance: ${latest.availableBalance ?? "N/A"}`);
    console.log(`Ledger Balance: ${latest.ledgerBalance ?? "N/A"}`);
  } else {
    console.log("No transactions found");
  }
}

getParentAccountBalance().catch(console.error);
