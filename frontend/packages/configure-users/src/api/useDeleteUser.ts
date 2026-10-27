// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {deleteUser} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import UserQueryKeys from '../constants/user-query-keys';

/**
 * Custom hook to delete a user by ID.
 *
 * @returns TanStack Query mutation object for deleting users
 */
export default function useDeleteUser(): UseMutationResult<void, Error, string> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('users');
  const {showToast} = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (userId: string): Promise<void> => {
      await deleteUser({...config, userId});
    },
    onSuccess: (_data, userId) => {
      queryClient.removeQueries({queryKey: [UserQueryKeys.USER, userId]});
      queryClient.invalidateQueries({queryKey: [UserQueryKeys.USERS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('delete.success'), 'success');
    },
  });
}
