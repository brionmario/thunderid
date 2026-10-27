// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import type {GroupListResponse} from '../../models/group';
import useGetGroups from '../useGetGroups';

const {config, mockGetGroups} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetGroups: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getGroups: mockGetGroups}));

describe('useGetGroups', () => {
  const response: GroupListResponse = {
    totalResults: 2,
    startIndex: 1,
    count: 2,
    groups: [
      {id: 'g1', name: 'Group One', ouId: 'ou-1'},
      {id: 'g2', name: 'Group Two', ouId: 'ou-1'},
    ],
  };

  beforeEach(() => {
    mockGetGroups.mockReset();
  });

  it('should load the first page by default', async () => {
    mockGetGroups.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetGroups());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetGroups).toHaveBeenCalledWith({...config, limit: 30, offset: 0});
  });

  it('should pass the paging params through and cache each page under its own key', async () => {
    mockGetGroups.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetGroups({limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetGroups).toHaveBeenCalledWith({...config, limit: 10, offset: 20});
    expect(queryClient.getQueryData([GroupQueryKeys.GROUPS, {limit: 10, offset: 20}])).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch groups');
    mockGetGroups.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetGroups());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
