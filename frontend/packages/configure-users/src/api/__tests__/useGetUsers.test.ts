// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import type {UserListResponse} from '../../models/users';
import useGetUsers from '../useGetUsers';

const {config, mockGetUsers} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetUsers: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getUsers: mockGetUsers}));

describe('useGetUsers', () => {
  const response: UserListResponse = {
    totalResults: 2,
    startIndex: 0,
    count: 2,
    users: [
      {id: 'user-1', ouId: 'ou-1', type: 'Employee', attributes: {username: 'john'}},
      {id: 'user-2', ouId: 'ou-1', type: 'Employee', attributes: {username: 'jane'}},
    ],
  };

  beforeEach(() => {
    mockGetUsers.mockReset();
  });

  it('should start in the loading state', () => {
    mockGetUsers.mockReturnValue(new Promise(() => null));

    const {result} = renderHook(() => useGetUsers());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should load the users through the SDK with the management config', async () => {
    mockGetUsers.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetUsers());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetUsers).toHaveBeenCalledWith({...config, filter: undefined, limit: undefined, offset: undefined});
  });

  it('should pass the paging and filter params through', async () => {
    mockGetUsers.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetUsers({filter: 'username eq "john"', limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetUsers).toHaveBeenCalledWith({...config, filter: 'username eq "john"', limit: 10, offset: 20});
  });

  it('should cache each page under its own key', async () => {
    mockGetUsers.mockResolvedValue(response);

    const {result, queryClient} = renderHook(() => useGetUsers({limit: 10, offset: 10}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(
      queryClient.getQueryData([UserQueryKeys.USERS, {limit: 10, offset: 10, filter: undefined}]),
    ).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch users');
    mockGetUsers.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetUsers());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
