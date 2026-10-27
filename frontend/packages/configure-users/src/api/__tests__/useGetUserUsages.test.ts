// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import type {UserUsagesResponse} from '../../models/users';
import useGetUserUsages from '../useGetUserUsages';

const {config, mock} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mock: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getUserUsages: mock}));

describe('useGetUserUsages', () => {
  const data = {usages: []} as unknown as UserUsagesResponse;

  beforeEach(() => {
    mock.mockReset();
  });

  it('should load through the SDK with the management config', async () => {
    mock.mockResolvedValueOnce(data);

    const {result, queryClient} = renderHook(() => useGetUserUsages('user-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(data);
    expect(mock).toHaveBeenCalledWith({...config, userId: 'user-1'});
    expect(queryClient.getQueryData([UserQueryKeys.USER_USAGES, 'user-1'])).toEqual(data);
  });

  it('should not fetch until an id is known', () => {
    const {result} = renderHook(() => useGetUserUsages(null));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mock).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Not found');
    mock.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetUserUsages('user-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('should not fetch while the caller keeps it disabled', () => {
    const {result} = renderHook(() => useGetUserUsages('user-1', false));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mock).not.toHaveBeenCalled();
  });
});
