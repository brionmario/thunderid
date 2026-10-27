// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getUsers} from '@thunderid/react';
import type {ApiFilteringParams} from '@thunderid/types';
import UserQueryKeys from '../constants/user-query-keys';
import type {UserListResponse} from '../models/users';

/**
 * Custom hook to fetch a list of users.
 *
 * @param params - Optional query parameters for filtering and pagination
 * @returns TanStack Query result object containing user list data, loading state, and error information
 */
export default function useGetUsers(params?: ApiFilteringParams): UseQueryResult<UserListResponse> {
  const config = useManagementApiConfig();
  const {limit, offset, filter} = params ?? {};

  return useQuery<UserListResponse>({
    queryKey: [UserQueryKeys.USERS, {limit, offset, filter}],
    queryFn: async (): Promise<UserListResponse> =>
      (await getUsers({...config, filter, limit, offset})) as unknown as UserListResponse,
  });
}
