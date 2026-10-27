// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {regenerateAgentSecret} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import AgentQueryKeys from '../constants/agent-query-keys';
import type {Agent} from '../models/agent';

export interface RegenerateAgentSecretVariables {
  agentId: string;
}

export interface RegenerateAgentSecretResult {
  agent: Agent;
  clientSecret: string;
}

export default function useRegenerateAgentSecret(): UseMutationResult<
  RegenerateAgentSecretResult,
  Error,
  RegenerateAgentSecretVariables
> {
  const config = useManagementApiConfig();
  const queryClient = useQueryClient();
  const {t} = useTranslation('agents');
  const {showToast} = useToast();

  return useMutation<RegenerateAgentSecretResult, Error, RegenerateAgentSecretVariables>({
    mutationFn: async ({agentId}: RegenerateAgentSecretVariables): Promise<RegenerateAgentSecretResult> =>
      (await regenerateAgentSecret({...config, agentId})) as unknown as RegenerateAgentSecretResult,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: [AgentQueryKeys.AGENT, variables.agentId]}).catch(() => undefined);
      queryClient.invalidateQueries({queryKey: [AgentQueryKeys.AGENTS]}).catch(() => undefined);
      showToast(t('regenerateSecret.snackbar.success', 'Client secret regenerated successfully'), 'success');
    },
  });
}
