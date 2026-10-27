// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {createUser, type CreateManagedUserRequest} from '@thunderid/react';
import type {User} from '@thunderid/types';
import {useTranslation} from 'react-i18next';
import UserQueryKeys from '../constants/user-query-keys';
import type {CreateUserRequest} from '../models/users';

/**
 * Custom hook to create a new user.
 *
 * @returns TanStack Query mutation object for creating users
 */
export default function useCreateUser(): UseMutationResult<User, Error, CreateUserRequest> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('users');
  const {showToast} = useToast();

  return useMutation<User, Error, CreateUserRequest>({
    mutationFn: async (userData: CreateUserRequest): Promise<User> =>
      (await createUser({...config, payload: userData as CreateManagedUserRequest})) as unknown as User,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [UserQueryKeys.USERS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('create.success'), 'success');
    },
  });
}
