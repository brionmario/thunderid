// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import ApplicationQueryKeys from '../../constants/application-query-keys';
import type {ApplicationListResponse} from '../../models/responses';
import useGetApplications from '../useGetApplications';

const {config, mockGetApplications} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetApplications: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getApplications: mockGetApplications}));

describe('useGetApplications', () => {
  const response = {
    totalResults: 1,
    count: 1,
    applications: [{id: 'app-1', name: 'My App'}],
  } as unknown as ApplicationListResponse;

  beforeEach(() => {
    mockGetApplications.mockReset();
  });

  it('should load the first page through the SDK with the default paging', async () => {
    mockGetApplications.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetApplications());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetApplications).toHaveBeenCalledWith({...config, limit: 30, offset: 0});
  });

  it('should pass the paging through and cache each page under its own key', async () => {
    mockGetApplications.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetApplications({limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetApplications).toHaveBeenCalledWith({...config, limit: 10, offset: 20});
    expect(queryClient.getQueryData([ApplicationQueryKeys.APPLICATIONS, {limit: 10, offset: 20}])).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch applications');
    mockGetApplications.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetApplications());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
