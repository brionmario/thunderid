// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getAgentType} from '@thunderid/react';
import AgentTypeQueryKeys from '../constants/agentTypeQueryKeys';
import type {ApiAgentType} from '../models/agent-type';

/**
 * Custom React hook to fetch a single agent type by ID from the server.
 *
 * @param id - The unique identifier of the agent type to fetch
 * @returns TanStack Query result object containing agent type data, loading state, and error information
 */
export default function useGetAgentType(id?: string): UseQueryResult<ApiAgentType> {
  const config = useManagementApiConfig();

  return useQuery<ApiAgentType>({
    queryKey: [AgentTypeQueryKeys.AGENT_TYPE, id],
    queryFn: async (): Promise<ApiAgentType> =>
      (await getAgentType({...config, agentTypeId: id!})) as unknown as ApiAgentType,
    enabled: Boolean(id),
  });
}
