// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import useUpdateUserCredentials from '../useUpdateUserCredentials';

const {config, mockUpdateUserCredentials, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateUserCredentials: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateUserCredentials: mockUpdateUserCredentials}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateUserCredentials', () => {
  const data = {credentials: {password: 'n3w-Secret'}};

  beforeEach(() => {
    mockUpdateUserCredentials.mockReset();
    mockShowToast.mockReset();
  });

  it('should update the credentials through the SDK and confirm with a toast', async () => {
    mockUpdateUserCredentials.mockResolvedValueOnce(undefined);

    const {result} = renderHook(() => useUpdateUserCredentials());

    result.current.mutate({userId: 'user-1', data});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockUpdateUserCredentials).toHaveBeenCalledWith({...config, payload: data, userId: 'user-1'});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Weak password');
    mockUpdateUserCredentials.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateUserCredentials());

    result.current.mutate({userId: 'user-1', data});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
