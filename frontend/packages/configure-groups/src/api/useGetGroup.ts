// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getGroup} from '@thunderid/react';
import GroupQueryKeys from '../constants/group-query-keys';
import type {Group} from '../models/group';

/**
 * Custom React hook to fetch a single group by ID.
 *
 * @param groupId - The ID of the group to fetch
 * @returns TanStack Query result object containing group data
 */
export default function useGetGroup(groupId: string): UseQueryResult<Group> {
  const config = useManagementApiConfig();

  return useQuery<Group>({
    queryKey: [GroupQueryKeys.GROUP, groupId],
    queryFn: async (): Promise<Group> => (await getGroup({...config, groupId})) as unknown as Group,
    enabled: Boolean(groupId),
  });
}
