"use client";

import { Icons } from "ui/icons";

export function ConnectorsBar() {
  return (
    <div className="flex justify-end mt-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 px-3 py-1.5 group text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        Connect apps
        <Icons.ChevronRight size={11} />
      </button>
    </div>
  );
}
