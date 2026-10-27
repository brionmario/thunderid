// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import type {CreateRoleRequest} from '../../models/requests';
import useCreateRole from '../useCreateRole';

const {config, mockCreateRole, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockCreateRole: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({createRole: mockCreateRole}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useCreateRole', () => {
  const payload: CreateRoleRequest = {
    name: 'Developer',
    ouId: 'ou-1',
    permissions: [{resourceServerId: 'rs-1', permissions: ['read']}],
    assignments: [{id: 'user-1', type: 'user'}],
  };
  const created = {id: 'role-1', ...payload};

  beforeEach(() => {
    mockCreateRole.mockReset();
    mockShowToast.mockReset();
  });

  it('should create the role through the SDK with the management config', async () => {
    mockCreateRole.mockResolvedValueOnce(created);

    const {result} = renderHook(() => useCreateRole());

    await expect(result.current.mutateAsync(payload)).resolves.toEqual(created);
    expect(mockCreateRole).toHaveBeenCalledWith({...config, payload});
  });

  it('should refresh the roles list and confirm with a toast', async () => {
    mockCreateRole.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateRole());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [RoleQueryKeys.ROLES]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Role already exists');
    mockCreateRole.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useCreateRole());

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
