"use client";

import { LogEvents } from "eventbus/events";
import { cn } from "ui/cn";
import { Icons } from "ui/icons";
import { useOpenPanel } from "@openpanel/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const SUGGESTION_POOL: Record<string, string[]> = {
  insights: [
    "What's my burn rate and runway?",
    "Show profit margins this quarter",
    "Compare revenue this month vs last month",
    "Show my cash flow summary",
    "What's my growth rate this year?",
  ],
  transactions: [
    "Find large transactions this month",
    "Show recurring expenses I could cut",
    "Categorize my uncategorized transactions",
    "Show latest transactions",
    "Find duplicate transactions",
  ],
  invoicing: [
    "Show unpaid invoices",
    "Which invoices are overdue?",
    "Show invoice analytics this quarter",
    "Create an invoice for...",
  ],
  tracking: [
    "How many hours did I log this week?",
    "Show unbilled time by project",
    "Start a timer for...",
    "What projects have the most tracked time?",
  ],
  web: [
    "Can I afford a new MacBook Pro?",
    "What's the VAT rate in my country?",
    "How does my revenue compare to industry benchmarks?",
    "What are current exchange rates for my currencies?",
  ],
  operations: [
    "Show unmatched inbox items",
    "Which customers owe the most?",
    "Who on my business has unreviewed transactions?",
    "Show expense breakdown by category",
  ],
};

function pickSuggestions(): string[] {
  return Object.values(SUGGESTION_POOL).map(
    (items) => items[Math.floor(Math.random() * items.length)]!,
  );
}

const ACCEPTED_TYPES = "image/*,application/pdf";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (files?: File[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onEscape?: () => void;
  onSuggestion?: (text: string) => void;
  menuPosition?: "above" | "below";
};

function extractTextValue(el: HTMLElement): string {
  let text = "";
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
    } else if (node instanceof HTMLBRElement) {
      text += "\n";
    } else if (node instanceof HTMLElement) {
      if (node.tagName === "DIV" && text.length > 0 && !text.endsWith("\n")) {
        text += "\n";
      }
      text += extractTextValue(node);
    }
  }
  return text;
}

function AttachmentPreview({
  files,
  onRemove,
}: {
  files: File[];
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pt-2 pb-1">
      <AnimatePresence mode="popLayout">
        {files.map((file, i) => (
          <motion.button
            key={`${file.name}-${file.size}`}
            layout
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            type="button"
            onClick={() => onRemove(i)}
            className="group flex items-center gap-1.5 border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/30 transition-colors max-w-[180px] overflow-hidden"
          >
            <Icons.Attachments
              size={13}
              className="flex-shrink-0 text-muted-foreground/40"
            />
            <span className="truncate">{file.name}</span>
            <Icons.Close
              size={10}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  placeholder = "How can I help you today?",
  autoFocus = false,
  onEscape,
  onSuggestion,
  menuPosition = "below",
}: ChatInputProps) {
  const editableRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const extractedValueRef = useRef(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [suggestions] = useState(pickSuggestions);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const { track } = useOpenPanel();

  useEffect(() => {
    const el = editableRef.current;
    if (!el) return;

    if (value !== extractedValueRef.current) {
      if (value === "") {
        el.innerHTML = "";
      } else {
        el.textContent = value;
        const sel = window.getSelection();
        if (sel) {
          const range = document.createRange();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
      extractedValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus && mounted) {
      editableRef.current?.focus();
    }
  }, [autoFocus, mounted]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest("[data-suggestions-toggle]")
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSuggestions]);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter((f) => f.size <= MAX_FILE_SIZE);
      if (!valid.length) return;
      setFiles((prev) => [...prev, ...valid]);
      track(LogEvents.AssistantFileAttached.name, { count: valid.length });
    },
    [track],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    editableRef.current?.focus();
  }, []);

  const openFilePicker = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_TYPES;
    input.multiple = true;
    input.onchange = () => {
      if (input.files?.length) {
        addFiles(Array.from(input.files));
      }
      editableRef.current?.focus();
    };
    input.click();
  }, [addFiles]);

  const handleInput = useCallback(() => {
    const el = editableRef.current;
    if (!el) return;

    let text = extractTextValue(el);

    if (!text.trim()) {
      text = "";
      if (el.innerHTML !== "") {
        el.innerHTML = "";
      }
    }

    extractedValueRef.current = text;
    onChange(text);
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  const handleSubmit = useCallback(() => {
    if (isStreaming) {
      onStop();
      return;
    }
    if (!value.trim() && !files.length) return;
    onSubmit(files.length ? files : undefined);
    setFiles([]);
  }, [value, files, isStreaming, onSubmit, onStop]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      document.execCommand("insertLineBreak");
    }
    if (e.key === "Escape") {
      if (showSuggestions) {
        setShowSuggestions(false);
        return;
      }
      editableRef.current?.blur();
      onEscape?.();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setShowSuggestions(false);
    if (onSuggestion) {
      onSuggestion(text);
    } else {
      onChange(text);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files?.length) {
        addFiles(Array.from(e.dataTransfer.files));
      }
    },
    [addFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="relative" onDrop={handleDrop} onDragOver={handleDragOver}>
      {showSuggestions && (
        <div
          ref={menuRef}
          className={cn(
            "absolute left-0 right-0 bg-[rgba(247,247,247,0.96)] dark:bg-[rgba(19,19,19,0.98)] backdrop-blur-lg max-h-[220px] overflow-y-auto z-30",
            menuPosition === "above" ? "bottom-full mb-1" : "top-full mt-1",
          )}
        >
          <div className="p-1">
            {suggestions.map((action) => (
              <button
                key={action}
                type="button"
                className="w-full text-left px-2.5 py-2.5 text-xs text-[#666] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSuggestionClick(action)}
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {files.length > 0 && (
        <AttachmentPreview files={files} onRemove={removeFile} />
      )}

      <div className="relative px-4 pt-4 pb-2.5 min-h-[52px]">
        <div
          ref={editableRef}
          contentEditable={mounted}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline={true}
          tabIndex={0}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className="w-full text-sm leading-[22px] outline-none max-h-[150px] overflow-y-auto whitespace-pre-wrap break-words"
        />
        {!value.trim() && (
          <div className="absolute top-4 left-4 text-sm leading-[22px] text-[#878787]/60 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-3 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            className="flex items-center h-6 cursor-pointer"
          >
            <Icons.Add
              size={16}
              className="text-[#878787]/60 hover:text-foreground transition-colors"
            />
          </button>

          <button
            type="button"
            data-suggestions-toggle
            onClick={() => {
              setShowSuggestions(!showSuggestions);
            }}
            className="flex items-center h-6 cursor-pointer"
          >
            <Icons.Bolt
              size={16}
              className={cn(
                "transition-colors",
                showSuggestions
                  ? "text-foreground"
                  : "text-[#878787]/60 hover:text-foreground",
              )}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isStreaming && !value.trim() && !files.length}
          {...(isStreaming
            ? { "data-track": LogEvents.AssistantStopped.name }
            : {})}
          className="size-7 flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isStreaming ? (
            <Icons.Stop className="size-3.5" />
          ) : (
            <Icons.ArrowUpward className="size-3.5" />
          )}
        </button>
      </div>

    </div>
  );
}
