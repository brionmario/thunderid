// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getUserTypes} from '@thunderid/react';
import UserQueryKeys from '../constants/user-query-keys';
import type {SchemaListParams, UserTypeListResponse} from '../models/users';

/**
 * Custom hook to fetch a list of user types.
 *
 * @param params - Optional query parameters for pagination
 * @returns TanStack Query result object containing user type list data, loading state, and error information
 */
export default function useGetUserTypes(params?: SchemaListParams): UseQueryResult<UserTypeListResponse> {
  const config = useManagementApiConfig();
  const {limit, offset} = params ?? {};

  return useQuery<UserTypeListResponse>({
    queryKey: [UserQueryKeys.USER_TYPES, {limit, offset}],
    queryFn: async (): Promise<UserTypeListResponse> =>
      (await getUserTypes({...config, limit, offset})) as unknown as UserTypeListResponse,
  });
}
