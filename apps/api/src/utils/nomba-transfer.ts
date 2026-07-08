import type { BankTransferResponse } from "@/services/nomba/types";

type TransferResult = {
  code: string;
  description: string;
  data: BankTransferResponse | null;
};

export function isNombaTransferAccepted(result: TransferResult): boolean {
  if (result.code === "00" || result.code === "01") {
    return true;
  }

  const description = result.description.toLowerCase();
  if (
    /process|pending|submitted|queued|accepted|success/.test(description)
  ) {
    return true;
  }

  const status = result.data?.status?.toLowerCase() ?? "";
  if (/process|pending|success/.test(status)) {
    return true;
  }

  if (result.data?.transactionRef) {
    return true;
  }

  return false;
}

export function isNombaTransferFinal(result: TransferResult): boolean {
  if (result.code === "00") {
    return true;
  }

  const status = result.data?.status?.toLowerCase() ?? "";
  return status === "success" || status === "successful";
}