// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// TEMPORARY: mirrors apps/console/src/features/agents/api/useGetAgents.ts. The agents feature
// hasn't been extracted into @thunderid/configure-agents yet; once it is, this file should be
// deleted and AddAssignmentDialog should import from that package instead.

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getAgents} from '@thunderid/react';
import type {AgentListResponse} from './agent';
import AgentQueryKeys from './agent-query-keys';

export interface UseGetAgentsParams {
  limit?: number;
  offset?: number;
}

export default function useGetAgents(params?: UseGetAgentsParams): UseQueryResult<AgentListResponse> {
  const config = useManagementApiConfig();
  const {limit = 30, offset = 0} = params ?? {};

  return useQuery<AgentListResponse>({
    queryKey: [AgentQueryKeys.AGENTS, {limit, offset}],
    queryFn: async (): Promise<AgentListResponse> =>
      (await getAgents({...config, limit, offset})) as unknown as AgentListResponse,
  });
}
