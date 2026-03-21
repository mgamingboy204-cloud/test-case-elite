"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";

type Identifiable = {
  id: string;
};

type SyncListOptions<TItem> = {
  sort?: (left: TItem, right: TItem) => number;
  insertAtStart?: boolean;
};

export function upsertById<TItem extends Identifiable>(
  items: TItem[] | undefined,
  nextItem: TItem,
  options?: SyncListOptions<TItem>
) {
  const current = items ?? [];
  const existingIndex = current.findIndex((item) => item.id === nextItem.id);
  const next =
    existingIndex >= 0
      ? current.map((item) => (item.id === nextItem.id ? nextItem : item))
      : options?.insertAtStart
        ? [nextItem, ...current]
        : [...current, nextItem];

  return options?.sort ? [...next].sort(options.sort) : next;
}

export function removeById<TItem extends Identifiable>(items: TItem[] | undefined, id: string) {
  return (items ?? []).filter((item) => item.id !== id);
}

export function syncItemInList<TItem extends Identifiable>(
  items: TItem[] | undefined,
  nextItem: TItem,
  isVisible: boolean,
  options?: SyncListOptions<TItem>
) {
  if (!isVisible) {
    return removeById(items, nextItem.id);
  }

  return upsertById(items, nextItem, options);
}

export async function invalidateQueryKeys(
  queryClient: QueryClient,
  queryKeysToInvalidate: Array<QueryKey>,
  exact = false
) {
  await Promise.all(
    queryKeysToInvalidate.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
        exact,
        refetchType: "active"
      })
    )
  );
}
