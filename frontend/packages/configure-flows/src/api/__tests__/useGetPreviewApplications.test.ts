// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import useGetPreviewApplication from '../useGetPreviewApplication';
import useGetPreviewApplications from '../useGetPreviewApplications';

const {config, mockGetApplication, mockGetApplications} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetApplication: vi.fn(),
  mockGetApplications: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getApplication: mockGetApplication, getApplications: mockGetApplications}));

describe('preview application hooks', () => {
  beforeEach(() => {
    mockGetApplication.mockReset();
    mockGetApplications.mockReset();
  });

  it('should list the applications through the SDK under the applications feature key', async () => {
    const list = {applications: [{id: 'app-1', name: 'Console'}], count: 1, totalResults: 1};
    mockGetApplications.mockResolvedValueOnce(list);

    const {result, queryClient} = renderHook(() => useGetPreviewApplications());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetApplications).toHaveBeenCalledWith(config);
    expect(queryClient.getQueryData(['applications', {limit: undefined, offset: undefined}])).toEqual(list);
  });

  it('should read the selected application through the SDK', async () => {
    mockGetApplication.mockResolvedValueOnce({id: 'app-1', name: 'Console'});

    const {result} = renderHook(() => useGetPreviewApplication('app-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetApplication).toHaveBeenCalledWith({...config, applicationId: 'app-1'});
  });

  it('should not read an application until one is chosen', () => {
    const {result} = renderHook(() => useGetPreviewApplication(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetApplication).not.toHaveBeenCalled();
  });
});
