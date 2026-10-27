// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getAgentRoles} from '@thunderid/react';
import AgentQueryKeys from '../constants/agent-query-keys';
import type {AgentRoleListResponse} from '../models/agent';

export interface UseGetAgentRolesParams {
  limit?: number;
  offset?: number;
}

export default function useGetAgentRoles(
  agentId: string,
  params?: UseGetAgentRolesParams,
): UseQueryResult<AgentRoleListResponse> {
  const config = useManagementApiConfig();
  const {limit = 30, offset = 0} = params ?? {};

  return useQuery<AgentRoleListResponse>({
    queryKey: [AgentQueryKeys.AGENT_ROLES, agentId, {limit, offset}],
    queryFn: async (): Promise<AgentRoleListResponse> =>
      (await getAgentRoles({...config, agentId, limit, offset})) as unknown as AgentRoleListResponse,
    enabled: Boolean(agentId),
  });
}
