// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {updateGroup, type UpdateGroupRequest as SdkUpdateGroupRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import GroupQueryKeys from '../constants/group-query-keys';
import type {Group} from '../models/group';
import type {UpdateGroupRequest} from '../models/requests';

/**
 * Variables for the update group mutation.
 */
export interface UpdateGroupVariables {
  groupId: string;
  data: UpdateGroupRequest;
}

/**
 * Custom React hook to update an existing group.
 *
 * @returns TanStack Query mutation object for updating groups
 */
export default function useUpdateGroup(): UseMutationResult<Group, Error, UpdateGroupVariables> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('groups');
  const {showToast} = useToast();

  return useMutation<Group, Error, UpdateGroupVariables>({
    mutationFn: async ({groupId, data}: UpdateGroupVariables): Promise<Group> =>
      (await updateGroup({...config, groupId, payload: data as SdkUpdateGroupRequest})) as unknown as Group,
    onSuccess: (_data, {groupId}) => {
      queryClient.invalidateQueries({queryKey: [GroupQueryKeys.GROUP, groupId]}).catch(() => {
        // Ignore invalidation errors
      });
      queryClient.invalidateQueries({queryKey: [GroupQueryKeys.GROUPS]}).catch(() => {
        // Ignore invalidation errors
      });
      queryClient.invalidateQueries({queryKey: [GroupQueryKeys.GROUP_MEMBERS, groupId]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('update.success'), 'success');
    },
  });
}
