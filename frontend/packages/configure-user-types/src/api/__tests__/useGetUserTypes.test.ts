// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserTypeQueryKeys from '../../constants/userTypeQueryKeys';
import type {UserTypeListResponse} from '../../types/user-types';
import useGetUserTypes from '../useGetUserTypes';

const {config, mockList} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockList: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getUserTypes: mockList}));

describe('useGetUserTypes', () => {
  const response: UserTypeListResponse = {
    totalResults: 1,
    startIndex: 1,
    count: 1,
    types: [
      {
        id: 'type-1',
        handle: 'person',
        displayName: 'Person',
        ouId: 'ou-1',
        ouHandle: 'root',
        allowSelfRegistration: false,
      },
    ],
  };

  beforeEach(() => {
    mockList.mockReset();
  });

  it('should start in the loading state', () => {
    mockList.mockReturnValue(new Promise(() => null));

    const {result} = renderHook(() => useGetUserTypes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should load through the SDK with the management config', async () => {
    mockList.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetUserTypes());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockList).toHaveBeenCalledWith({...config, limit: undefined, offset: undefined});
  });

  it('should pass the paging params through and cache each page under its own key', async () => {
    mockList.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetUserTypes({limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockList).toHaveBeenCalledWith({...config, limit: 10, offset: 20});
    expect(queryClient.getQueryData([UserTypeQueryKeys.USER_TYPES, {limit: 10, offset: 20}])).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch');
    mockList.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetUserTypes());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
