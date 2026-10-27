// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import type {UpdateUserRequest} from '../../models/users';
import useUpdateUser from '../useUpdateUser';

const {config, mockUpdateUser, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateUser: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateUser: mockUpdateUser}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateUser', () => {
  const data = {ouId: 'ou-1', type: 'Employee', attributes: {username: 'john'}} as UpdateUserRequest;
  const updated = {id: 'user-1', ...data};

  beforeEach(() => {
    mockUpdateUser.mockReset();
    mockShowToast.mockReset();
  });

  it('should update the user through the SDK with the management config', async () => {
    mockUpdateUser.mockResolvedValueOnce(updated);

    const {result} = renderHook(() => useUpdateUser());

    await expect(result.current.mutateAsync({userId: 'user-1', data})).resolves.toEqual(updated);
    expect(mockUpdateUser).toHaveBeenCalledWith({...config, payload: data, userId: 'user-1'});
  });

  it('should refresh the user and the users list, and confirm with a toast', async () => {
    mockUpdateUser.mockResolvedValueOnce(updated);

    const {result, queryClient} = renderHook(() => useUpdateUser());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({userId: 'user-1', data});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserQueryKeys.USER, 'user-1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserQueryKeys.USERS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Invalid attributes');
    mockUpdateUser.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateUser());

    result.current.mutate({userId: 'user-1', data});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
