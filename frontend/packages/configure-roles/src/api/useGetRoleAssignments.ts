// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getRoleAssignments} from '@thunderid/react';
import RoleQueryKeys from '../constants/role-query-keys';
import type {RoleAssignmentListParams} from '../models/requests';
import type {RoleAssignmentListResponse} from '../models/role';

export interface UseGetRoleAssignmentsParams extends RoleAssignmentListParams {
  roleId: string;
  /** Whether the query should be enabled (default: true when roleId is provided) */
  enabled?: boolean;
}

/**
 * Custom React hook to fetch a paginated list of role assignments.
 *
 * @param params - Role ID and optional pagination parameters
 * @returns TanStack Query result object containing assignments list data
 */
export default function useGetRoleAssignments(
  params: UseGetRoleAssignmentsParams,
): UseQueryResult<RoleAssignmentListResponse> {
  const config = useManagementApiConfig();
  const {roleId, limit = 30, offset = 0, include, type, enabled = true} = params;

  return useQuery<RoleAssignmentListResponse>({
    queryKey: [RoleQueryKeys.ROLE_ASSIGNMENTS, roleId, {limit, offset, include, type}],
    queryFn: async (): Promise<RoleAssignmentListResponse> =>
      (await getRoleAssignments({...config, limit, offset, roleId, type})) as unknown as RoleAssignmentListResponse,
    enabled: enabled && !!roleId,
  });
}
