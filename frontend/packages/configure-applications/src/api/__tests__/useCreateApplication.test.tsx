// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import ApplicationQueryKeys from '../../constants/application-query-keys';
import type {CreateApplicationRequest} from '../../models/requests';
import useCreateApplication from '../useCreateApplication';

const {config, mockCreateApplication, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockCreateApplication: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({createApplication: mockCreateApplication}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useCreateApplication', () => {
  const request: CreateApplicationRequest = {
    name: 'My App',
    inboundAuthConfig: [{type: 'oauth2', config: {grantTypes: ['authorization_code']}}],
  } as CreateApplicationRequest;
  const created = {id: 'app-1', ...request};

  beforeEach(() => {
    mockCreateApplication.mockReset();
    mockShowToast.mockReset();
  });

  it('should create the application through the SDK with the management config', async () => {
    mockCreateApplication.mockResolvedValueOnce(created);

    const {result} = renderHook(() => useCreateApplication());

    await expect(result.current.mutateAsync(request)).resolves.toEqual(created);
    expect(mockCreateApplication).toHaveBeenCalledWith({...config, payload: request});
  });

  it('should refresh the applications list and confirm with a toast', async () => {
    mockCreateApplication.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateApplication());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [ApplicationQueryKeys.APPLICATIONS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should still succeed when refreshing the list fails', async () => {
    mockCreateApplication.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateApplication());
    vi.spyOn(queryClient, 'invalidateQueries').mockRejectedValueOnce(new Error('Invalidation failed'));

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Conflict');
    mockCreateApplication.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useCreateApplication());

    result.current.mutate(request);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
