// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import RoleQueryKeys from '../../constants/role-query-keys';
import type {RoleListResponse} from '../../models/role';
import useGetRoles from '../useGetRoles';

const {config, mockGetRoles} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetRoles: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getRoles: mockGetRoles}));

describe('useGetRoles', () => {
  const response: RoleListResponse = {
    totalResults: 2,
    startIndex: 1,
    count: 2,
    roles: [
      {id: 'role-1', name: 'Admin', ouId: 'ou-1'},
      {id: 'role-2', name: 'Viewer', ouId: 'ou-1'},
    ],
  };

  beforeEach(() => {
    mockGetRoles.mockReset();
  });

  it('should load the first page by default', async () => {
    mockGetRoles.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetRoles());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetRoles).toHaveBeenCalledWith({...config, limit: 30, offset: 0});
  });

  it('should pass the paging params through and cache each page under its own key', async () => {
    mockGetRoles.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetRoles({limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetRoles).toHaveBeenCalledWith({...config, limit: 10, offset: 20});
    expect(queryClient.getQueryData([RoleQueryKeys.ROLES, {limit: 10, offset: 20}])).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch roles');
    mockGetRoles.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetRoles());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
