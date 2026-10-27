// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getRole} from '@thunderid/react';
import RoleQueryKeys from '../constants/role-query-keys';
import type {Role} from '../models/role';

/**
 * Custom React hook to fetch a single role by ID.
 *
 * @param roleId - The role ID to fetch
 * @returns TanStack Query result object containing role data
 */
export default function useGetRole(roleId: string): UseQueryResult<Role> {
  const config = useManagementApiConfig();

  return useQuery<Role>({
    queryKey: [RoleQueryKeys.ROLE, roleId],
    queryFn: async (): Promise<Role> => (await getRole({...config, roleId})) as unknown as Role,
    enabled: !!roleId,
  });
}
