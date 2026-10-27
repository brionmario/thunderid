// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {updateAgent, type UpdateAgentRequest as SdkUpdateAgentRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import AgentQueryKeys from '../constants/agent-query-keys';
import type {Agent, UpdateAgentRequest} from '../models/agent';

interface UpdateAgentParams {
  agentId: string;
  data: UpdateAgentRequest;
}

export default function useUpdateAgent(): UseMutationResult<Agent, Error, UpdateAgentParams> {
  const config = useManagementApiConfig();
  const queryClient = useQueryClient();
  const {t} = useTranslation('agents');
  const {showToast} = useToast();

  return useMutation<Agent, Error, UpdateAgentParams>({
    mutationFn: async ({agentId, data}: UpdateAgentParams): Promise<Agent> =>
      (await updateAgent({...config, agentId, payload: data as SdkUpdateAgentRequest})) as unknown as Agent,
    onSuccess: (_, {agentId}) => {
      queryClient.invalidateQueries({queryKey: [AgentQueryKeys.AGENT, agentId]}).catch(() => undefined);
      queryClient.invalidateQueries({queryKey: [AgentQueryKeys.AGENTS]}).catch(() => undefined);
      showToast(t('update.success'), 'success');
    },
  });
}
