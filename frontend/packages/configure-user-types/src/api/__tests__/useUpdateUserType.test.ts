// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import UserTypeQueryKeys from '../../constants/userTypeQueryKeys';
import type {UpdateUserTypeRequest} from '../../types/user-types';
import useUpdateUserType from '../useUpdateUserType';

const {config, mockUpdateUserType, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateUserType: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateUserType: mockUpdateUserType}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateUserType', () => {
  const data: UpdateUserTypeRequest = {
    displayName: 'Person',
    ouId: 'ou-1',
    schema: {email: {type: 'string', required: true}},
  };
  const updated = {id: 'type-1', handle: 'person', allowSelfRegistration: false, ...data};

  beforeEach(() => {
    mockUpdateUserType.mockReset();
    mockShowToast.mockReset();
  });

  it('should update the user type through the SDK with the management config', async () => {
    mockUpdateUserType.mockResolvedValueOnce(updated);

    const {result} = renderHook(() => useUpdateUserType());

    await expect(result.current.mutateAsync({userTypeId: 'type-1', data})).resolves.toEqual(updated);
    expect(mockUpdateUserType).toHaveBeenCalledWith({...config, payload: data, userTypeId: 'type-1'});
  });

  it('should refresh the user type and the list, and confirm with a toast', async () => {
    mockUpdateUserType.mockResolvedValueOnce(updated);

    const {result, queryClient} = renderHook(() => useUpdateUserType());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({userTypeId: 'type-1', data});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserTypeQueryKeys.USER_TYPE, 'type-1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [UserTypeQueryKeys.USER_TYPES]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Invalid schema');
    mockUpdateUserType.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateUserType());

    result.current.mutate({userTypeId: 'type-1', data});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
