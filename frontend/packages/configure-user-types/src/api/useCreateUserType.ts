// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {createUserType, type CreateUserTypeRequest as SdkCreateUserTypeRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import UserTypeQueryKeys from '../constants/userTypeQueryKeys';
import type {ApiUserType, CreateUserTypeRequest} from '../types/user-types';

/**
 * Custom React hook to create a new user type in the server.
 *
 * @returns TanStack Query mutation object for creating user types
 */
export default function useCreateUserType(): UseMutationResult<ApiUserType, Error, CreateUserTypeRequest> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('userTypes');
  const {showToast} = useToast();

  return useMutation<ApiUserType, Error, CreateUserTypeRequest>({
    mutationFn: async (requestData: CreateUserTypeRequest): Promise<ApiUserType> =>
      (await createUserType({
        ...config,
        payload: requestData as unknown as SdkCreateUserTypeRequest,
      })) as unknown as ApiUserType,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [UserTypeQueryKeys.USER_TYPES]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('create.success'), 'success');
    },
  });
}
