"use client";

export function useTemplateUpdate() {
  return {
    updateTemplate: () => {},
    isPending: false,
    isError: false,
    error: null,
    templateId: undefined,
  };
}
