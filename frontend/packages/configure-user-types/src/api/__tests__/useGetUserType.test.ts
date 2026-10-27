// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserTypeQueryKeys from '../../constants/userTypeQueryKeys';
import type {ApiUserType} from '../../types/user-types';
import useGetUserType from '../useGetUserType';

const {config, mockGetUserType} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetUserType: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getUserType: mockGetUserType}));

describe('useGetUserType', () => {
  const userType: ApiUserType = {
    id: 'type-1',
    handle: 'person',
    displayName: 'Person',
    ouId: 'ou-1',
    allowSelfRegistration: true,
    schema: {email: {type: 'string', required: true}},
  };

  beforeEach(() => {
    mockGetUserType.mockReset();
  });

  it('should load through the SDK with the management config', async () => {
    mockGetUserType.mockResolvedValueOnce(userType);

    const {result, queryClient} = renderHook(() => useGetUserType('type-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(userType);
    expect(mockGetUserType).toHaveBeenCalledWith({...config, userTypeId: 'type-1'});
    expect(queryClient.getQueryData([UserTypeQueryKeys.USER_TYPE, 'type-1'])).toEqual(userType);
  });

  it('should not fetch until an id is known', () => {
    const {result} = renderHook(() => useGetUserType(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetUserType).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Not found');
    mockGetUserType.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetUserType('type-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
