"use client";

import { extractTextFromValue } from "invoice";
import { cn } from "ui/cn";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

type Props = {
  index: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ProductAutocomplete({
  index,
  value,
  onChange,
  disabled = false,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  const parsedValue = extractTextFromValue(value);

  useLayoutEffect(() => {
    adjustTextareaHeight();
  }, [parsedValue, adjustTextareaHeight]);

  const handleInputChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
      requestAnimationFrame(adjustTextareaHeight);
    },
    [onChange, adjustTextareaHeight],
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const showPlaceholder = !parsedValue && !isFocused;

  return (
    <div>
      <textarea
        ref={textareaRef}
        value={parsedValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        rows={1}
        placeholder={
          isFocused && !parsedValue ? "Search or create product..." : ""
        }
        className={cn(
          "border-0 p-0 min-h-6 border-b border-transparent focus:border-border text-xs pt-1",
          "transition-colors duration-200 bg-transparent outline-none resize-none w-full",
          "text-primary leading-[18px] invoice-editor overflow-hidden",
          "placeholder:font-sans placeholder:text-muted-foreground",
          showPlaceholder &&
            "bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]",
        )}
      />
    </div>
  );
}
