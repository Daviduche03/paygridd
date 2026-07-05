"use client";

import type { NumericFormatProps } from "react-number-format";
import { AmountInput } from "./amount-input";

type Props = Omit<NumericFormatProps, "value" | "onChange"> & {
  name: string;
  lineItemIndex: number;
};

export function ProductAwareAmountInput({
  lineItemIndex,
  name,
  ...props
}: Props) {
  return (
    <AmountInput
      {...props}
      name={name}
    />
  );
}
