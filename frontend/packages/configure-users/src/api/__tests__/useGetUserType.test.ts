// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import type {ApiUserType} from '../../models/users';
import useGetUserType from '../useGetUserType';

const {config, mock} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mock: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getUserType: mock}));

describe('useGetUserType', () => {
  const data = {id: 'type-1', name: 'Employee', ouId: 'ou-1', schema: {}} as unknown as ApiUserType;

  beforeEach(() => {
    mock.mockReset();
  });

  it('should load through the SDK with the management config', async () => {
    mock.mockResolvedValueOnce(data);

    const {result, queryClient} = renderHook(() => useGetUserType('type-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(data);
    expect(mock).toHaveBeenCalledWith({...config, userTypeId: 'type-1'});
    expect(queryClient.getQueryData([UserQueryKeys.USER_TYPE, 'type-1'])).toEqual(data);
  });

  it('should not fetch until an id is known', () => {
    const {result} = renderHook(() => useGetUserType(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mock).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Not found');
    mock.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetUserType('type-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
