// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getAgent} from '@thunderid/react';
import AgentQueryKeys from '../constants/agent-query-keys';
import type {Agent} from '../models/agent';

export default function useGetAgent(agentId: string): UseQueryResult<Agent> {
  const config = useManagementApiConfig();

  return useQuery<Agent>({
    queryKey: [AgentQueryKeys.AGENT, agentId],
    queryFn: async (): Promise<Agent> => (await getAgent({...config, agentId})) as unknown as Agent,
    enabled: Boolean(agentId),
  });
}
