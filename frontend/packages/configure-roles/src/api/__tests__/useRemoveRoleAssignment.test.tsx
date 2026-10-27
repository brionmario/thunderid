// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import useRemoveRoleAssignment, {type RemoveRoleAssignmentVariables} from '../useRemoveRoleAssignment';

const {config, mockRemoveRoleAssignments, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockRemoveRoleAssignments: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({removeRoleAssignments: mockRemoveRoleAssignments}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useRemoveRoleAssignment', () => {
  const variables: RemoveRoleAssignmentVariables = {roleId: 'role-1', assignment: {id: 'user-1', type: 'user'}};

  beforeEach(() => {
    mockRemoveRoleAssignments.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should remove the assignment through the SDK with the management config', async () => {
    const {result} = renderHook(() => useRemoveRoleAssignment());

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRemoveRoleAssignments).toHaveBeenCalledWith({
      ...config,
      assignments: [{id: 'user-1', type: 'user'}],
      roleId: 'role-1',
    });
  });

  it('should refresh the role assignments and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useRemoveRoleAssignment());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [RoleQueryKeys.ROLE_ASSIGNMENTS, 'role-1']});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Request failed');
    mockRemoveRoleAssignments.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useRemoveRoleAssignment());

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
