// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserTypeQueryKeys from '../../constants/userTypeQueryKeys';
import useDeleteUserType from '../useDeleteUserType';

const {config, mockDeleteUserType, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockDeleteUserType: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({deleteUserType: mockDeleteUserType}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useDeleteUserType', () => {
  beforeEach(() => {
    mockDeleteUserType.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should delete the user type through the SDK with the management config', async () => {
    const {result} = renderHook(() => useDeleteUserType());

    await result.current.mutateAsync('type-1');

    expect(mockDeleteUserType).toHaveBeenCalledWith({...config, userTypeId: 'type-1'});
  });

  it('should drop the user type, refresh the list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useDeleteUserType());
    queryClient.setQueryData([UserTypeQueryKeys.USER_TYPE, 'type-1'], {id: 'type-1'});
    queryClient.setQueryData([UserTypeQueryKeys.USER_TYPE, 'type-2'], {id: 'type-2'});
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('type-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData([UserTypeQueryKeys.USER_TYPE, 'type-1'])).toBeUndefined();
    expect(queryClient.getQueryData([UserTypeQueryKeys.USER_TYPE, 'type-2'])).toEqual({id: 'type-2'});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserTypeQueryKeys.USER_TYPES]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('User type is in use');
    mockDeleteUserType.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useDeleteUserType());

    result.current.mutate('type-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
