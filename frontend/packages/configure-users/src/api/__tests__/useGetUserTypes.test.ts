// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import type {UserTypeListResponse} from '../../models/users';
import useGetUserTypes from '../useGetUserTypes';

const {config, mockGetUserTypes} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetUserTypes: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getUserTypes: mockGetUserTypes}));

describe('useGetUserTypes', () => {
  const response = {
    totalResults: 1,
    startIndex: 0,
    count: 1,
    types: [{id: 'type-1', name: 'Employee', ouId: 'ou-1'}],
  } as unknown as UserTypeListResponse;

  beforeEach(() => {
    mockGetUserTypes.mockReset();
  });

  it('should load the user types through the SDK with the management config', async () => {
    mockGetUserTypes.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetUserTypes());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetUserTypes).toHaveBeenCalledWith({...config, limit: undefined, offset: undefined});
  });

  it('should pass the paging params through and cache the page under them', async () => {
    mockGetUserTypes.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetUserTypes({limit: 100, offset: 0}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetUserTypes).toHaveBeenCalledWith({...config, limit: 100, offset: 0});
    expect(queryClient.getQueryData([UserQueryKeys.USER_TYPES, {limit: 100, offset: 0}])).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch user types');
    mockGetUserTypes.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetUserTypes());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
