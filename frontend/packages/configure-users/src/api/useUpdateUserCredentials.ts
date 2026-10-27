// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {updateUserCredentials} from '@thunderid/react';
import {useTranslation} from 'react-i18next';

export interface UpdateUserCredentialsVariables {
  userId: string;
  data: {
    credentials: Record<string, string>;
  };
}

export default function useUpdateUserCredentials(): UseMutationResult<void, Error, UpdateUserCredentialsVariables> {
  const config = useManagementApiConfig();
  const {t} = useTranslation('users');
  const {showToast} = useToast();

  return useMutation<void, Error, UpdateUserCredentialsVariables>({
    mutationFn: async ({userId, data}: UpdateUserCredentialsVariables): Promise<void> => {
      await updateUserCredentials({...config, payload: data, userId});
    },
    onSuccess: () => {
      showToast(t('updateCredentials.success'), 'success');
    },
  });
}
