// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {deleteGroup} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import GroupQueryKeys from '../constants/group-query-keys';

/**
 * Custom React hook to delete a group.
 *
 * @returns TanStack Query mutation object for deleting groups
 */
export default function useDeleteGroup(): UseMutationResult<void, Error, string> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('groups');
  const {showToast} = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (groupId: string): Promise<void> => {
      await deleteGroup({...config, groupId});
    },
    onSuccess: (_data, groupId) => {
      queryClient.removeQueries({queryKey: [GroupQueryKeys.GROUP, groupId]});
      queryClient.invalidateQueries({queryKey: [GroupQueryKeys.GROUPS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('delete.success'), 'success');
    },
  });
}
