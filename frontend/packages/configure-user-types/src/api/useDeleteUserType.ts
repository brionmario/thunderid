// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {deleteUserType} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import UserTypeQueryKeys from '../constants/userTypeQueryKeys';

/**
 * Custom React hook to delete a user type from the server.
 *
 * @returns TanStack Query mutation object for deleting user types
 */
export default function useDeleteUserType(): UseMutationResult<void, Error, string> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('userTypes');
  const {showToast} = useToast();

  return useMutation<void, Error, string>({
    mutationFn: async (userTypeId: string): Promise<void> => {
      await deleteUserType({...config, userTypeId});
    },
    onSuccess: (_data, userTypeId) => {
      queryClient.removeQueries({queryKey: [UserTypeQueryKeys.USER_TYPE, userTypeId]});
      queryClient.invalidateQueries({queryKey: [UserTypeQueryKeys.USER_TYPES]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('delete.success'), 'success');
    },
  });
}
