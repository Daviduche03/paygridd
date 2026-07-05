"use client";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (template: { id: string; name: string }) => void;
};

export function CreateTemplateDialog(_props: Props) {
  return null;
}
