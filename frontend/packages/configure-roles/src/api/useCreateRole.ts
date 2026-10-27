// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {createRole, type CreateRoleRequest as SdkCreateRoleRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import RoleQueryKeys from '../constants/role-query-keys';
import type {CreateRoleRequest} from '../models/requests';
import type {Role} from '../models/role';

/**
 * Custom React hook to create a new role.
 *
 * @returns TanStack Query mutation object for creating roles
 */
export default function useCreateRole(): UseMutationResult<Role, Error, CreateRoleRequest> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('roles');
  const {showToast} = useToast();

  return useMutation<Role, Error, CreateRoleRequest>({
    mutationFn: async (roleData: CreateRoleRequest): Promise<Role> =>
      (await createRole({...config, payload: roleData as SdkCreateRoleRequest})) as unknown as Role,
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [RoleQueryKeys.ROLES]}).catch(() => {
        /* noop */
      });
      showToast(t('create.success'), 'success');
    },
  });
}
