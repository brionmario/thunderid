// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {removeRoleAssignments} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import RoleQueryKeys from '../constants/role-query-keys';
import type {RoleAssignment} from '../models/role';

/**
 * Variables for the remove role assignment mutation.
 */
export interface RemoveRoleAssignmentVariables {
  roleId: string;
  assignment: RoleAssignment;
}

/**
 * Custom React hook to remove a user or group assignment from a role.
 *
 * @returns TanStack Query mutation object for removing a role assignment
 */
export default function useRemoveRoleAssignment(): UseMutationResult<void, Error, RemoveRoleAssignmentVariables> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('roles');
  const {showToast} = useToast();

  return useMutation<void, Error, RemoveRoleAssignmentVariables>({
    mutationFn: async (variables: RemoveRoleAssignmentVariables): Promise<void> => {
      await removeRoleAssignments({
        ...config,
        assignments: [variables.assignment],
        roleId: variables.roleId,
      });
    },
    onSuccess: (_data, {roleId}) => {
      queryClient.invalidateQueries({queryKey: [RoleQueryKeys.ROLE_ASSIGNMENTS, roleId]}).catch(() => {
        /* noop */
      });
      showToast(t('assignments.remove.success'), 'success');
    },
  });
}
