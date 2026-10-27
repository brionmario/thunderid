// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getAgents} from '@thunderid/react';
import AgentQueryKeys from '../constants/agent-query-keys';
import type {AgentListResponse} from '../models/agent';

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
