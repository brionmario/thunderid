// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getUser} from '@thunderid/react';
import type {User} from '@thunderid/types';
import UserQueryKeys from '../constants/user-query-keys';

/**
 * Custom hook to fetch a single user by ID.
 *
 * @param userId - The ID of the user to fetch
 * @returns TanStack Query result object containing user data, loading state, and error information
 */
export default function useGetUser(userId: string | undefined): UseQueryResult<User> {
  const config = useManagementApiConfig();

  return useQuery<User>({
    queryKey: [UserQueryKeys.USER, userId],
    queryFn: async (): Promise<User> => (await getUser({...config, userId: userId!})) as unknown as User,
    enabled: Boolean(userId),
  });
}
