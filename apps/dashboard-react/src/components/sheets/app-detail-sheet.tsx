"use client";

import { Sheet, SheetContent, SheetHeader } from "ui/sheet";
import { parseAsString, useQueryStates } from "nuqs";

export function AppDetailSheet() {
  const [params, setParams] = useQueryStates({
    "mcp-app": parseAsString,
  });

  const appId = params["mcp-app"];

  if (!appId) return null;

  return (
    <Sheet open={!!appId} onOpenChange={() => setParams({ "mcp-app": null })}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div>
              <h3 className="text-lg leading-none">Integration</h3>
            </div>
          </div>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
