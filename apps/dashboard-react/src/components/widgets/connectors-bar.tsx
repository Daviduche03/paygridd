"use client";

import { Icons } from "ui/icons";
import { ConnectorsModal } from "@/components/modals/connectors-modal";
import { useState } from "react";

export function ConnectorsBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end mt-1">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 group text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Connect apps
          <Icons.ChevronRight size={11} />
        </button>
      </div>

      <ConnectorsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
