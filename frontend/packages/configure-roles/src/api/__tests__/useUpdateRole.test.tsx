// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import type {UpdateRoleRequest} from '../../models/requests';
import type {Role} from '../../models/role';
import useUpdateRole, {ROLE_MUTATION_KEY, type UpdateRoleVariables} from '../useUpdateRole';

const {config, mockUpdateRole, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateRole: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateRole: mockUpdateRole}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateRole', () => {
  const current: Role = {
    id: 'role-1',
    name: 'Original Role',
    description: 'Original description',
    ouId: 'ou-1',
    ouHandle: 'my-org',
    permissions: [{resourceServerId: 'rs-1', permissions: ['read', 'write']}],
  };
  const data: UpdateRoleRequest = {
    name: 'Updated Role',
    description: 'Updated description',
    ouId: 'ou-1',
    permissions: [{resourceServerId: 'rs-1', permissions: ['read']}],
  };
  const updated: Role = {id: 'role-1', ...data};
  const variables: UpdateRoleVariables = {roleId: 'role-1', data};

  beforeEach(() => {
    mockUpdateRole.mockReset().mockResolvedValue(updated);
    mockShowToast.mockReset();
  });

  it('should update through the SDK with the management config', async () => {
    const {result} = renderHook(() => useUpdateRole());

    await expect(result.current.mutateAsync(variables)).resolves.toEqual(updated);
    expect(mockUpdateRole).toHaveBeenCalledWith({...config, payload: data, roleId: 'role-1'});
  });

  it('should merge the result into the cached role while keeping display-only fields', async () => {
    const {result, queryClient} = renderHook(() => useUpdateRole());
    queryClient.setQueryData([RoleQueryKeys.ROLE, 'role-1'], current);

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData<Role>([RoleQueryKeys.ROLE, 'role-1'])).toEqual({
      ...current,
      name: 'Updated Role',
      description: 'Updated description',
      permissions: [{resourceServerId: 'rs-1', permissions: ['read']}],
    });
  });

  it('should refresh the role and the roles list, and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useUpdateRole());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [RoleQueryKeys.ROLE, 'role-1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [RoleQueryKeys.ROLES]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should register the mutation under ROLE_MUTATION_KEY', async () => {
    const {result, queryClient} = renderHook(() => useUpdateRole());

    await result.current.mutateAsync(variables);

    expect(queryClient.getMutationCache().findAll({mutationKey: [...ROLE_MUTATION_KEY]})).toHaveLength(1);
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Request failed');
    mockUpdateRole.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateRole());

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
