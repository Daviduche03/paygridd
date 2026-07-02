"use client";

import type { RouterOutputs } from "@api/trpc/routers/_app";
import { Badge } from "ui/badge";

type Tag = NonNullable<
  RouterOutputs["documents"]["getById"]
>["documentTagAssignments"][number];

interface Props {
  id: string;
  tags?: Tag[];
}

export function DocumentTags({ tags }: Props) {
  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag.documentTag.id} variant="secondary">
          {tag.documentTag.name}
        </Badge>
      ))}
    </div>
  );
}
