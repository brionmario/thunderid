// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {updateUserType, type UpdateUserTypeRequest as SdkUpdateUserTypeRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import UserTypeQueryKeys from '../constants/userTypeQueryKeys';
import type {ApiUserType, UpdateUserTypeRequest} from '../types/user-types';

/**
 * Variables for the {@link useUpdateUserType} mutation.
 */
export interface UpdateUserTypeVariables {
  /**
   * The unique identifier of the user type to update
   */
  userTypeId: string;
  /**
   * The updated user type data
   */
  data: UpdateUserTypeRequest;
}

/**
 * Custom React hook to update an existing user type in the server.
 *
 * @returns TanStack Query mutation object for updating user types
 */
export default function useUpdateUserType(): UseMutationResult<ApiUserType, Error, UpdateUserTypeVariables> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('userTypes');
  const {showToast} = useToast();

  return useMutation<ApiUserType, Error, UpdateUserTypeVariables>({
    mutationFn: async ({userTypeId, data}: UpdateUserTypeVariables): Promise<ApiUserType> =>
      (await updateUserType({
        ...config,
        payload: data as unknown as SdkUpdateUserTypeRequest,
        userTypeId,
      })) as unknown as ApiUserType,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({queryKey: [UserTypeQueryKeys.USER_TYPE, variables.userTypeId]}).catch(() => {
        // Ignore invalidation errors
      });
      queryClient.invalidateQueries({queryKey: [UserTypeQueryKeys.USER_TYPES]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('update.success'), 'success');
    },
  });
}
