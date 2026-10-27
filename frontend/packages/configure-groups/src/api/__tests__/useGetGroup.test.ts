// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import type {Group} from '../../models/group';
import useGetGroup from '../useGetGroup';

const {config, mockGetGroup} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetGroup: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getGroup: mockGetGroup}));

describe('useGetGroup', () => {
  const group: Group = {id: 'g1', name: 'Platform team', ouId: 'ou-1', members: [{id: 'u1', type: 'user'}]};

  beforeEach(() => {
    mockGetGroup.mockReset();
  });

  it('should load the group through the SDK and cache it under its key', async () => {
    mockGetGroup.mockResolvedValueOnce(group);

    const {result, queryClient} = renderHook(() => useGetGroup('g1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(group);
    expect(mockGetGroup).toHaveBeenCalledWith({...config, groupId: 'g1'});
    expect(queryClient.getQueryData([GroupQueryKeys.GROUP, 'g1'])).toEqual(group);
  });

  it('should not fetch without a group ID', () => {
    const {result} = renderHook(() => useGetGroup(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetGroup).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Group not found');
    mockGetGroup.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetGroup('g1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
