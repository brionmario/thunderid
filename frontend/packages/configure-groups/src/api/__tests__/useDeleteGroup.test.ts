// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import useDeleteGroup from '../useDeleteGroup';

const {config, mockDeleteGroup, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockDeleteGroup: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({deleteGroup: mockDeleteGroup}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useDeleteGroup', () => {
  beforeEach(() => {
    mockDeleteGroup.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should delete through the SDK with the management config', async () => {
    const {result} = renderHook(() => useDeleteGroup());

    result.current.mutate('g1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteGroup).toHaveBeenCalledWith({...config, groupId: 'g1'});
  });

  it('should drop the group, refresh the groups list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useDeleteGroup());
    queryClient.setQueryData([GroupQueryKeys.GROUP, 'g1'], {id: 'g1'});
    queryClient.setQueryData([GroupQueryKeys.GROUP, 'g2'], {id: 'g2'});
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('g1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData([GroupQueryKeys.GROUP, 'g1'])).toBeUndefined();
    expect(queryClient.getQueryData([GroupQueryKeys.GROUP, 'g2'])).toEqual({id: 'g2'});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUPS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Request failed');
    mockDeleteGroup.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useDeleteGroup());

    result.current.mutate('g1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
