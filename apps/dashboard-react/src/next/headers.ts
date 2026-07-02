export function cookies() {
  return {
    get: (name: string) => {
      if (typeof document === "undefined") return undefined;
      const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
      return match ? { name, value: decodeURIComponent(match[1]) } : undefined;
    },
    set: (name: string, value: string, opts?: any) => {
      if (typeof document === "undefined") return;
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${opts?.maxAge || 604800}`;
    },
    delete: (name: string) => {
      if (typeof document === "undefined") return;
      document.cookie = `${name}=; path=/; max-age=0`;
    },
  };
}

export function headers() {
  return new Headers();
}
