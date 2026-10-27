// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getUserType} from '@thunderid/react';
import UserQueryKeys from '../constants/user-query-keys';
import type {ApiUserType} from '../models/users';

/**
 * Custom hook to fetch a single user type by ID.
 *
 * @param id - The ID of the user type to fetch
 * @returns TanStack Query result object containing user type data, loading state, and error information
 */
export default function useGetUserType(id?: string): UseQueryResult<ApiUserType> {
  const config = useManagementApiConfig();

  return useQuery<ApiUserType>({
    queryKey: [UserQueryKeys.USER_TYPE, id],
    queryFn: async (): Promise<ApiUserType> =>
      (await getUserType({...config, userTypeId: id!})) as unknown as ApiUserType,
    enabled: Boolean(id),
  });
}
