// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getUserUsages} from '@thunderid/react';
import UserQueryKeys from '../constants/user-query-keys';
import type {UserUsagesResponse} from '../models/users';

/**
 * Custom hook to fetch resources that reference a user, such as agents that list the user
 * as their owner. Used to populate the pre-delete confirmation dialog.
 *
 * @param userId - The unique identifier of the user
 * @param enabled - Whether the query should run (default true)
 * @returns TanStack Query result with user usages data
 */
export default function useGetUserUsages(userId: string | null, enabled = true): UseQueryResult<UserUsagesResponse> {
  const config = useManagementApiConfig();

  return useQuery<UserUsagesResponse>({
    queryKey: [UserQueryKeys.USER_USAGES, userId],
    queryFn: async (): Promise<UserUsagesResponse> =>
      (await getUserUsages({...config, userId: userId!})) as unknown as UserUsagesResponse,
    enabled: Boolean(userId) && enabled,
  });
}
