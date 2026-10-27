// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import type {Role} from '../../models/role';
import useGetRole from '../useGetRole';

const {config, mockGetRole} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetRole: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getRole: mockGetRole}));

describe('useGetRole', () => {
  const role: Role = {
    id: 'role-1',
    name: 'Admin',
    ouId: 'ou-1',
    permissions: [{resourceServerId: 'rs-1', permissions: ['read', 'write']}],
  };

  beforeEach(() => {
    mockGetRole.mockReset();
  });

  it('should load the role through the SDK and cache it under its key', async () => {
    mockGetRole.mockResolvedValueOnce(role);

    const {result, queryClient} = renderHook(() => useGetRole('role-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(role);
    expect(mockGetRole).toHaveBeenCalledWith({...config, roleId: 'role-1'});
    expect(queryClient.getQueryData([RoleQueryKeys.ROLE, 'role-1'])).toEqual(role);
  });

  it('should not fetch without a role ID', () => {
    const {result} = renderHook(() => useGetRole(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetRole).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Role not found');
    mockGetRole.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetRole('role-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
