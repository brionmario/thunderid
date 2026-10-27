// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import useDeleteRole from '../useDeleteRole';

const {config, mockDeleteRole, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockDeleteRole: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({deleteRole: mockDeleteRole}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useDeleteRole', () => {
  beforeEach(() => {
    mockDeleteRole.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should delete through the SDK with the management config', async () => {
    const {result} = renderHook(() => useDeleteRole());

    result.current.mutate('role-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteRole).toHaveBeenCalledWith({...config, roleId: 'role-1'});
  });

  it('should drop the role, refresh the roles list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useDeleteRole());
    queryClient.setQueryData([RoleQueryKeys.ROLE, 'role-1'], {id: 'role-1'});
    queryClient.setQueryData([RoleQueryKeys.ROLE, 'role-2'], {id: 'role-2'});
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('role-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData([RoleQueryKeys.ROLE, 'role-1'])).toBeUndefined();
    expect(queryClient.getQueryData([RoleQueryKeys.ROLE, 'role-2'])).toEqual({id: 'role-2'});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [RoleQueryKeys.ROLES]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Request failed');
    mockDeleteRole.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useDeleteRole());

    result.current.mutate('role-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
