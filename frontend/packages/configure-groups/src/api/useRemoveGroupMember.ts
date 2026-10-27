// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {removeGroupMembers, type GroupMember} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import GroupQueryKeys from '../constants/group-query-keys';
import type {Member} from '../models/group';

/**
 * Variables for the remove group member mutation.
 */
export interface RemoveGroupMemberVariables {
  groupId: string;
  member: Member;
}

/**
 * Custom React hook to remove a member from an existing group.
 *
 * @returns TanStack Query mutation object for removing a group member
 */
export default function useRemoveGroupMember(): UseMutationResult<void, Error, RemoveGroupMemberVariables> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('groups');
  const {showToast} = useToast();

  return useMutation<void, Error, RemoveGroupMemberVariables>({
    mutationFn: async (variables: RemoveGroupMemberVariables): Promise<void> => {
      await removeGroupMembers({
        ...config,
        groupId: variables.groupId,
        members: [variables.member as GroupMember],
      });
    },
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
      showToast(t('removeMember.success'), 'success');
    },
  });
}
