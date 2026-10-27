// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import type {MemberListResponse} from '../../models/group';
import useGetAllGroupMembers from '../useGetAllGroupMembers';

const {config, mockGetGroupMembers} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetGroupMembers: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getGroupMembers: mockGetGroupMembers}));

describe('useGetAllGroupMembers', () => {
  beforeEach(() => {
    mockGetGroupMembers.mockReset();
  });

  it('should fetch and combine every member page', async () => {
    const firstPage: MemberListResponse = {
      totalResults: 101,
      startIndex: 1,
      count: 100,
      members: Array.from({length: 100}, (_, index) => ({id: `member-${index}`, type: 'user' as const})),
    };
    const secondPage: MemberListResponse = {
      totalResults: 101,
      startIndex: 101,
      count: 1,
      members: [{id: 'member-100', type: 'user'}],
    };
    mockGetGroupMembers.mockResolvedValueOnce(firstPage).mockResolvedValueOnce(secondPage);

    const {result} = renderHook(() => useGetAllGroupMembers('g1'));

    await waitFor(() => {
      expect(result.current.data?.members).toHaveLength(101);
    });

    expect(mockGetGroupMembers).toHaveBeenNthCalledWith(1, {...config, groupId: 'g1', limit: 100, offset: 0});
    expect(mockGetGroupMembers).toHaveBeenNthCalledWith(2, {...config, groupId: 'g1', limit: 100, offset: 100});
    expect(result.current.data?.totalResults).toBe(101);
  });

  it('should stop when a page comes back empty', async () => {
    mockGetGroupMembers.mockResolvedValueOnce({totalResults: 5, startIndex: 1, count: 0, members: []});

    const {result} = renderHook(() => useGetAllGroupMembers('g1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetGroupMembers).toHaveBeenCalledTimes(1);
    expect(result.current.data?.members).toEqual([]);
  });

  it('should not fetch without a group ID', () => {
    const {result} = renderHook(() => useGetAllGroupMembers(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetGroupMembers).not.toHaveBeenCalled();
  });
});
