// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import type {UpdateGroupRequest} from '../../models/requests';
import useUpdateGroup from '../useUpdateGroup';

const {config, mockUpdateGroup, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateGroup: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateGroup: mockUpdateGroup}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateGroup', () => {
  const data: UpdateGroupRequest = {name: 'Renamed', ouId: 'ou-1'};
  const updated = {id: 'g1', ...data};

  beforeEach(() => {
    mockUpdateGroup.mockReset();
    mockShowToast.mockReset();
  });

  it('should update the group through the SDK with the management config', async () => {
    mockUpdateGroup.mockResolvedValueOnce(updated);

    const {result} = renderHook(() => useUpdateGroup());

    await expect(result.current.mutateAsync({groupId: 'g1', data})).resolves.toEqual(updated);
    expect(mockUpdateGroup).toHaveBeenCalledWith({...config, groupId: 'g1', payload: data});
  });

  it('should refresh the group, its members and the groups list, and confirm with a toast', async () => {
    mockUpdateGroup.mockResolvedValueOnce(updated);

    const {result, queryClient} = renderHook(() => useUpdateGroup());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({groupId: 'g1', data});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUP, 'g1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUPS]});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUP_MEMBERS, 'g1']});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Name taken');
    mockUpdateGroup.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateGroup());

    result.current.mutate({groupId: 'g1', data});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
