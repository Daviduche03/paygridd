import { useState } from "react";
import { getApiUrl } from "@/utils/api-url";

interface UploadParams {
  file: File;
  path: string[];
  bucket?: string;
}

interface UploadResult {
  url: string;
  path: string[];
}

function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )auth-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildApiUrl(path: string) {
  const base = getApiUrl();
  return base ? `${base}${path}` : path;
}

export function useUpload() {
  const [isLoading, setLoading] = useState<boolean>(false);

  const uploadFile = async ({
    file,
    path,
  }: UploadParams): Promise<UploadResult> => {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = getAuthToken();
      const res = await fetch(buildApiUrl("/files/upload"), {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Upload failed");
      }

      const json = await res.json();
      const fileName = json.data?.path || file.name;
      const url = buildApiUrl(`/files/download/${fileName}`);

      return {
        url,
        path: [...path, fileName],
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    uploadFile,
    isLoading,
  };
}
