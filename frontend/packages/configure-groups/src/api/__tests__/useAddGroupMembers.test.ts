// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import useAddGroupMembers from '../useAddGroupMembers';

const {config, mockAddGroupMembers, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockAddGroupMembers: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({addGroupMembers: mockAddGroupMembers}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useAddGroupMembers', () => {
  const members = [{id: 'u1', type: 'user' as const}];

  beforeEach(() => {
    mockAddGroupMembers.mockReset().mockResolvedValue({id: 'g1'});
    mockShowToast.mockReset();
  });

  it('should add the members through the SDK with the management config', async () => {
    const {result} = renderHook(() => useAddGroupMembers());

    await result.current.mutateAsync({groupId: 'g1', members});

    expect(mockAddGroupMembers).toHaveBeenCalledWith({...config, groupId: 'g1', members});
  });

  it('should refresh the group, its members and the groups list, and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useAddGroupMembers());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({groupId: 'g1', members});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUP, 'g1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUPS]});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUP_MEMBERS, 'g1']});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Failed to add');
    mockAddGroupMembers.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useAddGroupMembers());

    result.current.mutate({groupId: 'g1', members});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
