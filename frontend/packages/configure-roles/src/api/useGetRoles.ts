// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {keepPreviousData, useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getRoles} from '@thunderid/react';
import RoleQueryKeys from '../constants/role-query-keys';
import type {RoleListParams} from '../models/requests';
import type {RoleListResponse} from '../models/role';

/**
 * Custom React hook to fetch a paginated list of roles.
 *
 * @param params - Optional pagination parameters
 * @returns TanStack Query result object containing roles list data
 */
export default function useGetRoles(params?: RoleListParams): UseQueryResult<RoleListResponse> {
  const config = useManagementApiConfig();
  const {limit = 30, offset = 0} = params ?? {};

  return useQuery<RoleListResponse>({
    queryKey: [RoleQueryKeys.ROLES, {limit, offset}],
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<RoleListResponse> =>
      (await getRoles({...config, limit, offset})) as unknown as RoleListResponse,
  });
}
