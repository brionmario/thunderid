// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getUserTypes} from '@thunderid/react';
import UserTypeQueryKeys from '../constants/userTypeQueryKeys';
import type {UserTypeListParams, UserTypeListResponse} from '../types/user-types';

/**
 * Custom React hook to fetch a paginated list of user types from the server.
 *
 * @param params - Optional pagination parameters
 * @param params.limit - Maximum number of records to return
 * @param params.offset - Number of records to skip for pagination
 * @returns TanStack Query result object containing user types list data, loading state, and error information
 */
export default function useGetUserTypes(params?: UserTypeListParams): UseQueryResult<UserTypeListResponse> {
  const config = useManagementApiConfig();
  const {limit, offset} = params ?? {};

  return useQuery<UserTypeListResponse>({
    queryKey: [UserTypeQueryKeys.USER_TYPES, {limit, offset}],
    queryFn: async (): Promise<UserTypeListResponse> =>
      (await getUserTypes({...config, limit, offset})) as unknown as UserTypeListResponse,
  });
}
