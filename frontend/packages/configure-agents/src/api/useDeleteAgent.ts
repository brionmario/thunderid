// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {deleteAgent} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import AgentQueryKeys from '../constants/agent-query-keys';

export default function useDeleteAgent(): UseMutationResult<void, Error, string> {
  const config = useManagementApiConfig();
  const queryClient = useQueryClient();
  const {t} = useTranslation('agents');
  const {showToast} = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (agentId: string): Promise<void> => {
      await deleteAgent({...config, agentId});
    },
    onSuccess: (_data, agentId) => {
      queryClient.removeQueries({queryKey: [AgentQueryKeys.AGENT, agentId]});
      queryClient.invalidateQueries({queryKey: [AgentQueryKeys.AGENTS]}).catch(() => undefined);
      showToast(t('delete.success', 'Agent deleted successfully'), 'success');
    },
  });
}
