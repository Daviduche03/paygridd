"use client";

import { Category } from "@/components/category";

type Selected = {
  id: string;
  name: string;
  color?: string | null;
  slug: string;
  children?: Selected[];
};

type Props = {
  selected?: Selected;
  onChange: (selected: Selected) => void;
};

export function InlineSelectCategory({ selected }: Props) {
  return (
    <button
      type="button"
      className="w-full text-left"
    >
      <Category name={selected?.name ?? ""} color={selected?.color ?? ""} />
    </button>
  );
}
