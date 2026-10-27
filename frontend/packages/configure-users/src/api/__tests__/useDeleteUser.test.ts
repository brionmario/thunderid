// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserQueryKeys from '../../constants/user-query-keys';
import useDeleteUser from '../useDeleteUser';

const {config, mockDeleteUser, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockDeleteUser: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({deleteUser: mockDeleteUser}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useDeleteUser', () => {
  beforeEach(() => {
    mockDeleteUser.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should delete through the SDK with the management config', async () => {
    const {result} = renderHook(() => useDeleteUser());

    result.current.mutate('user-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteUser).toHaveBeenCalledWith({...config, userId: 'user-1'});
  });

  it('should drop the user, refresh the users list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useDeleteUser());
    queryClient.setQueryData([UserQueryKeys.USER, 'user-1'], {id: 'user-1'});
    queryClient.setQueryData([UserQueryKeys.USER, 'user-2'], {id: 'user-2'});
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('user-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData([UserQueryKeys.USER, 'user-1'])).toBeUndefined();
    expect(queryClient.getQueryData([UserQueryKeys.USER, 'user-2'])).toEqual({id: 'user-2'});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserQueryKeys.USERS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Request failed');
    mockDeleteUser.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useDeleteUser());

    result.current.mutate('user-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
