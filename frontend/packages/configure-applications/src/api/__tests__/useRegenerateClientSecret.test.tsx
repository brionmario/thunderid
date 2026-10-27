// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import ApplicationQueryKeys from '../../constants/application-query-keys';
import useRegenerateClientSecret from '../useRegenerateClientSecret';

const {config, mockRegenerateClientSecret, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockRegenerateClientSecret: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({regenerateClientSecret: mockRegenerateClientSecret}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useRegenerateClientSecret', () => {
  const applicationId = 'app-1';
  const rotated = {application: {id: applicationId, name: 'My App'}, clientSecret: 'new-secret'};

  beforeEach(() => {
    mockRegenerateClientSecret.mockReset().mockResolvedValue(rotated);
    mockShowToast.mockReset();
  });

  it('should regenerate through the SDK with the management config', async () => {
    const {result} = renderHook(() => useRegenerateClientSecret());

    await expect(result.current.mutateAsync({applicationId})).resolves.toEqual(rotated);
    expect(mockRegenerateClientSecret).toHaveBeenCalledWith({...config, applicationId});
  });

  it('should refresh the application and the list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useRegenerateClientSecret());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({applicationId});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [ApplicationQueryKeys.APPLICATION, applicationId]});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [ApplicationQueryKeys.APPLICATIONS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  // The SDK refuses an application without an OAuth 2 client, so no unusable secret reaches the dialog.
  it('should surface a refusal without a toast', async () => {
    const error = new Error('The application has no OAuth client');
    mockRegenerateClientSecret.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useRegenerateClientSecret());

    result.current.mutate({applicationId});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
