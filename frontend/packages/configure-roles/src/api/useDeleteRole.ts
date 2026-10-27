// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {deleteRole} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import RoleQueryKeys from '../constants/role-query-keys';

/**
 * Custom React hook to delete a role.
 *
 * @returns TanStack Query mutation object for deleting roles
 */
export default function useDeleteRole(): UseMutationResult<void, Error, string> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('roles');
  const {showToast} = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (roleId: string): Promise<void> => {
      await deleteRole({...config, roleId});
    },
    onSuccess: (_data, roleId) => {
      queryClient.removeQueries({queryKey: [RoleQueryKeys.ROLE, roleId]});
      queryClient.invalidateQueries({queryKey: [RoleQueryKeys.ROLES]}).catch(() => {
        /* noop */
      });
      showToast(t('delete.success'), 'success');
    },
  });
}
