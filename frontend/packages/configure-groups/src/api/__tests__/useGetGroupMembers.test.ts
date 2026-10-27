// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import type {MemberListResponse} from '../../models/group';
import useGetGroupMembers from '../useGetGroupMembers';

const {config, mockGetGroupMembers} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetGroupMembers: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getGroupMembers: mockGetGroupMembers}));

describe('useGetGroupMembers', () => {
  const response: MemberListResponse = {
    totalResults: 1,
    startIndex: 1,
    count: 1,
    members: [{id: 'u1', type: 'user', display: 'John'}],
  };

  beforeEach(() => {
    mockGetGroupMembers.mockReset();
  });

  it('should load the first page by default', async () => {
    mockGetGroupMembers.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetGroupMembers('g1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetGroupMembers).toHaveBeenCalledWith({...config, groupId: 'g1', limit: 30, offset: 0});
  });

  it('should pass the paging params through and cache each page under its own key', async () => {
    mockGetGroupMembers.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetGroupMembers('g1', {limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetGroupMembers).toHaveBeenCalledWith({...config, groupId: 'g1', limit: 10, offset: 20});
    expect(queryClient.getQueryData([GroupQueryKeys.GROUP_MEMBERS, 'g1', {limit: 10, offset: 20}])).toEqual(response);
  });

  it('should not fetch without a group ID', () => {
    const {result} = renderHook(() => useGetGroupMembers(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetGroupMembers).not.toHaveBeenCalled();
  });
});
