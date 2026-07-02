import { Icons } from "ui/icons";
import { useTokenModalStore } from "@/store/token-modal";
import { EmptyState as BaseEmptyState } from "@/components/empty-state";

export function EmptyState() {
  const { setData } = useTokenModalStore();

  return (
    <BaseEmptyState
      icon={<Icons.Vault className="size-5" />}
      title="No API keys found"
      description="No API keys have been created for this business yet."
      action={{ label: "Create API Key", onClick: () => setData(undefined, "create"), size: "default" }}
    />
  );
}
