// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getAgentTypes} from '@thunderid/react';
import AgentTypeQueryKeys from '../constants/agentTypeQueryKeys';
import type {AgentTypeListParams} from '../models/requests';
import type {AgentTypeListResponse} from '../models/responses';

/**
 * Custom React hook to fetch a paginated list of agent types from the server.
 *
 * @param params - Optional pagination parameters
 * @param params.limit - Maximum number of records to return
 * @param params.offset - Number of records to skip for pagination
 * @param options - Optional query options
 * @param options.enabled - Set to false to skip the request
 * @returns TanStack Query result object containing agent types list data, loading state, and error information
 */
export default function useGetAgentTypes(
  params?: AgentTypeListParams,
  options?: {enabled?: boolean},
): UseQueryResult<AgentTypeListResponse> {
  const config = useManagementApiConfig();
  const {limit, offset} = params ?? {};

  return useQuery<AgentTypeListResponse>({
    queryKey: [AgentTypeQueryKeys.AGENT_TYPES, {limit, offset}],
    queryFn: async (): Promise<AgentTypeListResponse> =>
      (await getAgentTypes({...config, limit, offset})) as unknown as AgentTypeListResponse,
    enabled: options?.enabled ?? true,
  });
}
