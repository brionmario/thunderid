// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import type {User} from '@thunderid/types';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import useGetUser from '../useGetUser';

const {config, mock} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mock: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getUser: mock}));

describe('useGetUser', () => {
  const data = {id: 'user-1', ouId: 'ou-1', type: 'Employee', attributes: {username: 'john'}} as unknown as User;

  beforeEach(() => {
    mock.mockReset();
  });

  it('should load through the SDK with the management config', async () => {
    mock.mockResolvedValueOnce(data);

    const {result, queryClient} = renderHook(() => useGetUser('user-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(data);
    expect(mock).toHaveBeenCalledWith({...config, userId: 'user-1'});
    expect(queryClient.getQueryData([UserQueryKeys.USER, 'user-1'])).toEqual(data);
  });

  it('should not fetch until an id is known', () => {
    const {result} = renderHook(() => useGetUser(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mock).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Not found');
    mock.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetUser('user-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
