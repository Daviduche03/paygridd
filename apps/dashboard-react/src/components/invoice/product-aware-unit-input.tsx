"use client";

import { Input } from "./input";

type Props = {
  name: string;
  lineItemIndex: number;
};

export function ProductAwareUnitInput({
  lineItemIndex,
  name,
  ...props
}: Props) {
  return (
    <Input
      {...props}
      name={name}
    />
  );
}
