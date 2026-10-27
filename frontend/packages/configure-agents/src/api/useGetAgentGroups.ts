// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getAgentGroups} from '@thunderid/react';
import AgentQueryKeys from '../constants/agent-query-keys';
import type {AgentGroupListResponse} from '../models/agent';

export interface UseGetAgentGroupsParams {
  limit?: number;
  offset?: number;
}

export default function useGetAgentGroups(
  agentId: string,
  params?: UseGetAgentGroupsParams,
): UseQueryResult<AgentGroupListResponse> {
  const config = useManagementApiConfig();
  const {limit = 30, offset = 0} = params ?? {};

  return useQuery<AgentGroupListResponse>({
    queryKey: [AgentQueryKeys.AGENT_GROUPS, agentId, {limit, offset}],
    queryFn: async (): Promise<AgentGroupListResponse> =>
      (await getAgentGroups({...config, agentId, limit, offset})) as unknown as AgentGroupListResponse,
    enabled: Boolean(agentId),
  });
}
