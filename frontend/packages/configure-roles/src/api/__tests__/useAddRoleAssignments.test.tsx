// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import type {RoleAssignment} from '../../models/role';
import useAddRoleAssignments from '../useAddRoleAssignments';

const {config, mockAddRoleAssignments, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockAddRoleAssignments: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({addRoleAssignments: mockAddRoleAssignments}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useAddRoleAssignments', () => {
  const assignments: RoleAssignment[] = [
    {id: 'user-1', type: 'user'},
    {id: 'group-1', type: 'group'},
  ];

  beforeEach(() => {
    mockAddRoleAssignments.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should assign the role through the SDK with the management config', async () => {
    const {result} = renderHook(() => useAddRoleAssignments());

    await result.current.mutateAsync({roleId: 'role-1', assignments});

    expect(mockAddRoleAssignments).toHaveBeenCalledWith({...config, assignments, roleId: 'role-1'});
  });

  it('should refresh the role assignments and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useAddRoleAssignments());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({roleId: 'role-1', assignments});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [RoleQueryKeys.ROLE_ASSIGNMENTS, 'role-1']});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Assignee not found');
    mockAddRoleAssignments.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useAddRoleAssignments());

    result.current.mutate({roleId: 'role-1', assignments});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
