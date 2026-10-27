// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {updateAgentType, type UpdateAgentTypeRequest as SdkUpdateAgentTypeRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import AgentTypeQueryKeys from '../constants/agentTypeQueryKeys';
import type {ApiAgentType} from '../models/agent-type';
import type {UpdateAgentTypeRequest} from '../models/requests';

/**
 * Variables for the {@link useUpdateAgentType} mutation.
 */
export interface UpdateAgentTypeVariables {
  /**
   * The unique identifier of the agent type to update
   */
  agentTypeId: string;
  /**
   * The updated agent type data
   */
  data: UpdateAgentTypeRequest;
}

/**
 * Custom React hook to update an existing agent type in the server.
 *
 * @returns TanStack Query mutation object for updating agent types
 */
export default function useUpdateAgentType(): UseMutationResult<ApiAgentType, Error, UpdateAgentTypeVariables> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('agentTypes');
  const {showToast} = useToast();

  return useMutation<ApiAgentType, Error, UpdateAgentTypeVariables>({
    mutationFn: async ({agentTypeId, data}: UpdateAgentTypeVariables): Promise<ApiAgentType> =>
      (await updateAgentType({
        ...config,
        agentTypeId,
        payload: data as unknown as SdkUpdateAgentTypeRequest,
      })) as unknown as ApiAgentType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: [AgentTypeQueryKeys.AGENT_TYPE, variables.agentTypeId]}).catch(() => {
        // Ignore invalidation errors
      });
      queryClient.invalidateQueries({queryKey: [AgentTypeQueryKeys.AGENT_TYPES]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('update.success'), 'success');
    },
  });
}
