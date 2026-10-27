// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import ApplicationQueryKeys from '../../constants/application-query-keys';
import useGetApplication from '../useGetApplication';

const {config, mockGetApplication} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetApplication: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getApplication: mockGetApplication}));

describe('useGetApplication', () => {
  const application = {id: 'app-1', name: 'My App', inboundAuthConfig: []};

  beforeEach(() => {
    mockGetApplication.mockReset();
  });

  it('should load the application through the SDK and cache it under its id', async () => {
    mockGetApplication.mockResolvedValueOnce(application);

    const {result, queryClient} = renderHook(() => useGetApplication('app-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(application);
    expect(mockGetApplication).toHaveBeenCalledWith({...config, applicationId: 'app-1'});
    expect(queryClient.getQueryData([ApplicationQueryKeys.APPLICATION, 'app-1'])).toEqual(application);
  });

  it('should not fetch without an application id', () => {
    const {result} = renderHook(() => useGetApplication(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetApplication).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch application');
    mockGetApplication.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetApplication('app-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
