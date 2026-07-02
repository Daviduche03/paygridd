import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

type InvoiceType = "edit" | "create" | "details" | "success" | null;

function parseSearchParams(searchParams: URLSearchParams) {
  return {
    selectedCustomerId: searchParams.get("selectedCustomerId"),
    invoiceType: searchParams.get("invoiceType") as InvoiceType,
    invoiceId: searchParams.get("invoiceId"),
    editRecurringId: searchParams.get("editRecurringId"),
    emailPreview: searchParams.get("emailPreview") === "true" ? true : null,
    canvas: searchParams.get("canvas") === "true" ? true : null,
  };
}

export function useInvoiceParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseSearchParams(searchParams), [searchParams]);

  const setParams = useCallback(
    (newParams: Record<string, string | null> | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (newParams === null) {
          Object.keys(parseSearchParams(prev)).forEach((key) => next.delete(key));
        } else {
          Object.entries(newParams).forEach(([key, value]) => {
            if (value === null) {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          });
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams],
  );

  return {
    ...params,
    setParams,
  };
}
