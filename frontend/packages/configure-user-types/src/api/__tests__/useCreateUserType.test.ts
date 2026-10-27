// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserTypeQueryKeys from '../../constants/userTypeQueryKeys';
import type {CreateUserTypeRequest} from '../../types/user-types';
import useCreateUserType from '../useCreateUserType';

const {config, mockCreateUserType, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockCreateUserType: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({createUserType: mockCreateUserType}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useCreateUserType', () => {
  const request: CreateUserTypeRequest = {
    handle: 'person',
    displayName: 'Person',
    ouId: 'ou-1',
    schema: {email: {type: 'string', required: true}},
  };
  const created = {id: 'type-1', allowSelfRegistration: false, ...request};

  beforeEach(() => {
    mockCreateUserType.mockReset();
    mockShowToast.mockReset();
  });

  it('should create the user type through the SDK with the management config', async () => {
    mockCreateUserType.mockResolvedValueOnce(created);

    const {result} = renderHook(() => useCreateUserType());

    await expect(result.current.mutateAsync(request)).resolves.toEqual(created);
    expect(mockCreateUserType).toHaveBeenCalledWith({...config, payload: request});
  });

  it('should refresh the user types list and confirm with a toast', async () => {
    mockCreateUserType.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateUserType());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserTypeQueryKeys.USER_TYPES]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should still succeed when refreshing the list fails', async () => {
    mockCreateUserType.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateUserType());
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValueOnce(new Error('Invalidation failed'));

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Conflict');
    mockCreateUserType.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useCreateUserType());

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
