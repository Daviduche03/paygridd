"use client";

import { formatEditorContent } from "invoice/format-to-html";
import { transformBusinessToContent } from "invoice/utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useTRPC } from "@/trpc/client";

export function FromDetails() {
  const { setValue, watch } = useFormContext();
  const trpc = useTRPC();
  const fromDetails = watch("fromDetails");

  const { data: user } = useQuery(trpc.user.me.queryOptions());
  const { data: business } = useQuery({
    ...trpc.business.get.queryOptions({ id: user?.businessId! }),
    enabled: Boolean(user?.businessId),
  });

  useEffect(() => {
    if (fromDetails || !business) return;

    const content = transformBusinessToContent(business, user);
    if (!content) return;

    setValue("fromDetails", content, {
      shouldValidate: true,
      shouldDirty: false,
    });
    setValue("template.fromLabel", "Me", { shouldDirty: false });
  }, [business, user, fromDetails, setValue]);

  return (
    <div>
      <span className="mb-2 block text-[11px] text-[#878787]">Me</span>
      <div className="min-h-[90px] text-[11px] leading-[18px] text-primary">
        {fromDetails ? (
          formatEditorContent(fromDetails)
        ) : (
          <span className="text-muted-foreground">Loading…</span>
        )}
      </div>
    </div>
  );
}