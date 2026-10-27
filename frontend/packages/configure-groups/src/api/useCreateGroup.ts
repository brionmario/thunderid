// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {createGroup, type CreateGroupRequest as SdkCreateGroupRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import GroupQueryKeys from '../constants/group-query-keys';
import type {Group} from '../models/group';
import type {CreateGroupRequest} from '../models/requests';

/**
 * Custom React hook to create a new group.
 *
 * @returns TanStack Query mutation object for creating groups
 */
export default function useCreateGroup(): UseMutationResult<Group, Error, CreateGroupRequest> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('groups');
  const {showToast} = useToast();

  return useMutation<Group, Error, CreateGroupRequest>({
    mutationFn: async (groupData: CreateGroupRequest): Promise<Group> =>
      (await createGroup({...config, payload: groupData as SdkCreateGroupRequest})) as unknown as Group,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [GroupQueryKeys.GROUPS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('create.success'), 'success');
    },
  });
}
