// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getUserType} from '@thunderid/react';
import UserTypeQueryKeys from '../constants/userTypeQueryKeys';
import type {ApiUserType} from '../types/user-types';

/**
 * Custom React hook to fetch a single user type by ID from the server.
 *
 * @param id - The unique identifier of the user type to fetch
 * @returns TanStack Query result object containing user type data, loading state, and error information
 */
export default function useGetUserType(id?: string): UseQueryResult<ApiUserType> {
  const config = useManagementApiConfig();

  return useQuery<ApiUserType>({
    queryKey: [UserTypeQueryKeys.USER_TYPE, id],
    queryFn: async (): Promise<ApiUserType> =>
      (await getUserType({...config, userTypeId: id!})) as unknown as ApiUserType,
    enabled: Boolean(id),
  });
}
