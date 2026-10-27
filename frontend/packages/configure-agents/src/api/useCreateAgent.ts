// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {createAgent, type CreateAgentRequest as SdkCreateAgentRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import AgentQueryKeys from '../constants/agent-query-keys';
import type {Agent, CreateAgentRequest} from '../models/agent';

/**
 * Creates an agent with the agents management API, without running an onboarding flow.
 */
export default function useCreateAgent(): UseMutationResult<Agent, Error, CreateAgentRequest> {
  const config = useManagementApiConfig();
  const queryClient = useQueryClient();
  const {t} = useTranslation('agents');
  const {showToast} = useToast();

  return useMutation<Agent, Error, CreateAgentRequest>({
    mutationFn: async (data: CreateAgentRequest): Promise<Agent> =>
      (await createAgent({...config, payload: data as SdkCreateAgentRequest})) as unknown as Agent,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [AgentQueryKeys.AGENTS]}).catch(() => undefined);
      showToast(t('create.success'), 'success');
    },
  });
}
