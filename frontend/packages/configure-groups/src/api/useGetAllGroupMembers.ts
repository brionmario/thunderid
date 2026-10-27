// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getGroupMembers} from '@thunderid/react';
import GroupQueryKeys from '../constants/group-query-keys';
import type {Member, MemberListResponse} from '../models/group';

const pageSize = 100;

export default function useGetAllGroupMembers(groupId: string | undefined): UseQueryResult<MemberListResponse> {
  const config = useManagementApiConfig();

  return useQuery<MemberListResponse>({
    queryKey: [GroupQueryKeys.GROUP_MEMBERS, groupId, 'all'],
    queryFn: async (): Promise<MemberListResponse> => {
      const members: Member[] = [];
      let totalResults = 0;
      let offset = 0;

      do {
        const page = (await getGroupMembers({
          ...config,
          groupId: groupId!,
          limit: pageSize,
          offset,
        })) as unknown as MemberListResponse;

        members.push(...page.members);
        totalResults = page.totalResults;
        offset += page.count;

        if (page.count === 0) break;
      } while (offset < totalResults);

      return {
        totalResults,
        startIndex: 1,
        count: members.length,
        members,
        links: [],
      };
    },
    enabled: Boolean(groupId),
  });
}
