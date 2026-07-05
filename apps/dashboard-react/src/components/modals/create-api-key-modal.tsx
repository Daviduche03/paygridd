"use client";

import { Button } from "ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "ui/dialog";
import { useTokenModalStore } from "@/store/token-modal";
import { CopyInput } from "../copy-input";

export function CreateApiKeyModal() {
  const { setData, createdKey, type, setCreatedKey } = useTokenModalStore();

  return (
    <Dialog
      open={type === "create"}
      onOpenChange={() => {
        setData(undefined);
        setTimeout(() => {
          setCreatedKey(undefined);
        }, 500);
      }}
    >
      <DialogContent className="max-w-[455px]">
        <div className="p-4 space-y-4">
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              For security reasons, the key will only be shown once. Please copy
              and store it in a secure location.
            </DialogDescription>
          </DialogHeader>

          <CopyInput value={createdKey} />

          <DialogFooter>
            <Button onClick={() => setData(undefined)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
