"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "ui/card";
import { CopyInput } from "@/components/copy-input";
import { useBusinessQuery } from "@/hooks/use-business";

export function BusinessIdSection() {
  const { data: business } = useBusinessQuery();

  if (!business?.id) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business ID</CardTitle>
        <CardDescription>
          This is your business's unique identifier within PayGrid.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <CopyInput value={business.id} />
      </CardContent>

      <CardFooter>
        <p className="text-xs text-muted-foreground">
          Used when interacting with the PayGrid API.
        </p>
      </CardFooter>
    </Card>
  );
}
