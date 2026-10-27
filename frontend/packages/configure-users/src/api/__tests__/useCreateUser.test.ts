// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import type {CreateUserRequest} from '../../models/users';
import useCreateUser from '../useCreateUser';

const {config, mockCreateUser, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockCreateUser: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({createUser: mockCreateUser}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useCreateUser', () => {
  const request: CreateUserRequest = {ouId: 'ou-1', type: 'Employee', attributes: {username: 'john'}};
  const created = {id: 'user-1', ...request};

  beforeEach(() => {
    mockCreateUser.mockReset();
    mockShowToast.mockReset();
  });

  it('should create the user through the SDK with the management config', async () => {
    mockCreateUser.mockResolvedValueOnce(created);

    const {result} = renderHook(() => useCreateUser());

    await expect(result.current.mutateAsync(request)).resolves.toEqual(created);
    expect(mockCreateUser).toHaveBeenCalledWith({...config, payload: request});
  });

  it('should refresh the users list and confirm with a toast', async () => {
    mockCreateUser.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateUser());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserQueryKeys.USERS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should still succeed when refreshing the list fails', async () => {
    mockCreateUser.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateUser());
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValueOnce(new Error('Invalidation failed'));

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Conflict');
    mockCreateUser.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useCreateUser());

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
