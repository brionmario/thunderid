// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import type {RoleAssignmentListResponse} from '../../models/role';
import useGetRoleAssignments from '../useGetRoleAssignments';

const {config, mockGetRoleAssignments} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetRoleAssignments: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getRoleAssignments: mockGetRoleAssignments}));

describe('useGetRoleAssignments', () => {
  const response: RoleAssignmentListResponse = {
    totalResults: 1,
    startIndex: 1,
    count: 1,
    assignments: [{id: 'user-1', type: 'user', display: 'John'}],
  };

  beforeEach(() => {
    mockGetRoleAssignments.mockReset();
  });

  it('should load the first page of every assignee type by default', async () => {
    mockGetRoleAssignments.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetRoleAssignments({roleId: 'role-1'}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetRoleAssignments).toHaveBeenCalledWith({
      ...config,
      limit: 30,
      offset: 0,
      roleId: 'role-1',
      type: undefined,
    });
  });

  it('should pass the paging params and type through and cache each page under its own key', async () => {
    mockGetRoleAssignments.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() =>
      useGetRoleAssignments({roleId: 'role-1', limit: 10, offset: 20, include: 'display', type: 'user'}),
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetRoleAssignments).toHaveBeenCalledWith({
      ...config,
      limit: 10,
      offset: 20,
      roleId: 'role-1',
      type: 'user',
    });
    expect(
      queryClient.getQueryData([
        RoleQueryKeys.ROLE_ASSIGNMENTS,
        'role-1',
        {limit: 10, offset: 20, include: 'display', type: 'user'},
      ]),
    ).toEqual(response);
  });

  it('should not fetch without a role ID or when disabled', () => {
    const {result: noRole} = renderHook(() => useGetRoleAssignments({roleId: ''}));
    const {result: disabled} = renderHook(() => useGetRoleAssignments({roleId: 'role-1', enabled: false}));

    expect(noRole.current.fetchStatus).toBe('idle');
    expect(disabled.current.fetchStatus).toBe('idle');
    expect(mockGetRoleAssignments).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch role assignments');
    mockGetRoleAssignments.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetRoleAssignments({roleId: 'role-1'}));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
