"use client";

import { Input } from "ui/input";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounceValue } from "usehooks-ts";
import { useConnectParams } from "@/hooks/use-connect-params";
import { useTRPC } from "@/trpc/client";
import { BankLogo } from "./bank-logo";
import { CountrySelector } from "./country-selector";

const nameWidths = [140, 100, 180, 120, 160, 130, 150, 110, 170, 90];

type BankSearchContentProps = {
  enabled: boolean;
  redirectPath?: string;
  listHeight?: string;
  defaultCountryCode?: string;
  fadeGradientClass?: string;
  emptyState?:
    | React.ReactNode
    | ((context: { query: string; countryCode: string }) => React.ReactNode);
};

export function BankSearchContent({
  enabled,
  listHeight = "h-[430px]",
  fadeGradientClass,
  defaultCountryCode,
  emptyState,
}: BankSearchContentProps) {
  const trpc = useTRPC();
  const initialCountryCode = defaultCountryCode || "";

  const {
    countryCode,
    search: query,
    setParams,
  } = useConnectParams(initialCountryCode);

  const [debouncedQuery] = useDebounceValue(query ?? "", 200);

  const { data, isLoading } = useQuery({
    ...trpc.institutions.get.queryOptions(
      {
        q: debouncedQuery,
        countryCode,
      },
      {
        enabled,
      },
    ),
    placeholderData: keepPreviousData,
  });

  return (
    <div>
      <div className="flex space-x-2 relative">
        <Input
          placeholder="Search bank..."
          type="search"
          onChange={(evt) => setParams({ search: evt.target.value || null })}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          autoFocus
          value={query ?? ""}
        />

        <div className="absolute right-0">
          <CountrySelector
            defaultValue={countryCode}
            onSelect={(countryCode) => {
              setParams({ countryCode });
            }}
          />
        </div>
      </div>

      <div className="relative">
        <div
          className={`${listHeight} space-y-0.5 overflow-auto scrollbar-hide pt-2 mt-2 pb-16`}
        >
          {isLoading && (
            <div className="space-y-0.5">
              {Array.from(new Array(10), (_, index) => (
                <div
                  className="flex justify-between items-center -mx-2 px-2 py-2"
                  key={index.toString()}
                >
                  <div className="flex items-center">
                    <div className="h-[34px] w-[34px] rounded-full bg-muted shrink-0" />
                    <div className="flex flex-col space-y-1.5 ml-3">
                      <div
                        className="h-2.5 bg-muted rounded-none"
                        style={{ width: nameWidths[index] }}
                      />
                      <div className="h-2 bg-muted rounded-none w-[60px]" />
                    </div>
                  </div>
                  <div className="h-3 w-[50px] bg-muted rounded-none opacity-50" />
                </div>
              ))}
            </div>
          )}

          {data?.map((institution) => {
            if (!institution) {
              return null;
            }

            return (
              <div
                key={institution.id}
                className="group flex justify-between items-center -mx-2 px-2 py-2 rounded-md transition-colors"
              >
                <div className="flex items-center min-w-0">
                  <BankLogo src={institution.logo} alt={institution.name} />

                  <div className="ml-3 min-w-0">
                    <p className="text-sm font-medium leading-none truncate">
                      {institution.name}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {!isLoading &&
            data?.length === 0 &&
            (typeof emptyState === "function" ? (
              emptyState({ query: debouncedQuery, countryCode })
            ) : emptyState ? (
              emptyState
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[350px]">
                <p className="font-medium mb-2">No banks found</p>
                <p className="text-sm text-center text-[#878787]">
                  We couldn't find a bank matching your criteria.
                </p>
              </div>
            ))}
        </div>
        {fadeGradientClass && (
          <div
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 ${fadeGradientClass}`}
          />
        )}
      </div>
    </div>
  );
}
