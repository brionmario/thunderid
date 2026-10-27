// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import ApplicationQueryKeys from '../../constants/application-query-keys';
import type {CreateApplicationRequest} from '../../models/requests';
import useUpdateApplication from '../useUpdateApplication';

const {config, mockUpdateApplication, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateApplication: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateApplication: mockUpdateApplication}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateApplication', () => {
  const data = {name: 'Renamed App', description: 'Updated'} as CreateApplicationRequest;
  const updated = {id: 'app-1', ...data};

  beforeEach(() => {
    mockUpdateApplication.mockReset();
    mockShowToast.mockReset();
  });

  it('should update the application through the SDK with the management config', async () => {
    mockUpdateApplication.mockResolvedValueOnce(updated);

    const {result} = renderHook(() => useUpdateApplication());

    await expect(result.current.mutateAsync({applicationId: 'app-1', data})).resolves.toEqual(updated);
    expect(mockUpdateApplication).toHaveBeenCalledWith({...config, applicationId: 'app-1', payload: data});
  });

  it('should refresh the application and the list and confirm with a toast', async () => {
    mockUpdateApplication.mockResolvedValueOnce(updated);

    const {result, queryClient} = renderHook(() => useUpdateApplication());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({applicationId: 'app-1', data});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [ApplicationQueryKeys.APPLICATION, 'app-1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [ApplicationQueryKeys.APPLICATIONS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Bad request');
    mockUpdateApplication.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateApplication());

    result.current.mutate({applicationId: 'app-1', data});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
