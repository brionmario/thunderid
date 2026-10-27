// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {updateUser, type UpdateManagedUserRequest} from '@thunderid/react';
import type {User} from '@thunderid/types';
import {useTranslation} from 'react-i18next';
import UserQueryKeys from '../constants/user-query-keys';
import type {UpdateUserRequest} from '../models/users';

/**
 * Variables for the update user mutation.
 */
export interface UpdateUserVariables {
  userId: string;
  data: UpdateUserRequest;
}

/**
 * Custom hook to update an existing user.
 *
 * @returns TanStack Query mutation object for updating users
 */
export default function useUpdateUser(): UseMutationResult<User, Error, UpdateUserVariables> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('users');
  const {showToast} = useToast();

  return useMutation<User, Error, UpdateUserVariables>({
    mutationFn: async ({userId, data}: UpdateUserVariables): Promise<User> =>
      (await updateUser({...config, payload: data as UpdateManagedUserRequest, userId})) as unknown as User,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: [UserQueryKeys.USER, variables.userId]}).catch(() => {
        // Ignore invalidation errors
      });
      queryClient.invalidateQueries({queryKey: [UserQueryKeys.USERS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('update.success'), 'success');
    },
  });
}
