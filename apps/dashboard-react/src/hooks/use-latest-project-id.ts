import { useLocalStorage } from "./use-local-storage";

export function useLatestProjectId(businessId?: string | null) {
  // Include businessId in the key to prevent sharing across businesses
  const storageKey = businessId
    ? `latest-project-id-${businessId}`
    : "latest-project-id";

  const [latestProjectId, setLatestProjectId] = useLocalStorage<string | null>(
    storageKey,
    null,
  );

  return {
    latestProjectId,
    setLatestProjectId,
  };
}
