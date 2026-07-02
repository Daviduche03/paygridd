import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryOptions,
  type UseInfiniteQueryResult,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

export function useStableQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[],
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryResult<TData, TError> {
  return useQuery({
    ...options,
    placeholderData: options.placeholderData ?? keepPreviousData,
  });
}

export function useStableInfiniteQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends readonly unknown[],
  TPageParam,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >,
): UseInfiniteQueryResult<TData, TError> {
  return useInfiniteQuery({
    ...options,
    placeholderData: options.placeholderData ?? keepPreviousData,
  });
}
