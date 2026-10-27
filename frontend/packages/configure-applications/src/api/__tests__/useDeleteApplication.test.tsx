// Copyright 2025-2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import ApplicationQueryKeys from '../../constants/application-query-keys';
import useDeleteApplication from '../useDeleteApplication';

const {config, mockDeleteApplication, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockDeleteApplication: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({deleteApplication: mockDeleteApplication}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useDeleteApplication', () => {
  beforeEach(() => {
    mockDeleteApplication.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should delete through the SDK with the management config', async () => {
    const {result} = renderHook(() => useDeleteApplication());

    result.current.mutate('app-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteApplication).toHaveBeenCalledWith({...config, applicationId: 'app-1'});
  });

  it('should drop the application, refresh the list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useDeleteApplication());
    queryClient.setQueryData([ApplicationQueryKeys.APPLICATION, 'app-1'], {id: 'app-1'});
    queryClient.setQueryData([ApplicationQueryKeys.APPLICATION, 'app-2'], {id: 'app-2'});
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('app-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData([ApplicationQueryKeys.APPLICATION, 'app-1'])).toBeUndefined();
    expect(queryClient.getQueryData([ApplicationQueryKeys.APPLICATION, 'app-2'])).toEqual({id: 'app-2'});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [ApplicationQueryKeys.APPLICATIONS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Request failed');
    mockDeleteApplication.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useDeleteApplication());

    result.current.mutate('app-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
