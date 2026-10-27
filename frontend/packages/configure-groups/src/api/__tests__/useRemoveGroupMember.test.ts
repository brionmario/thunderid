// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import useRemoveGroupMember, {type RemoveGroupMemberVariables} from '../useRemoveGroupMember';

const {config, mockRemoveGroupMembers, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockRemoveGroupMembers: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({removeGroupMembers: mockRemoveGroupMembers}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useRemoveGroupMember', () => {
  const variables: RemoveGroupMemberVariables = {groupId: 'g1', member: {id: 'u1', type: 'user'}};

  beforeEach(() => {
    mockRemoveGroupMembers.mockReset().mockResolvedValue({id: 'g1'});
    mockShowToast.mockReset();
  });

  it('should remove the member through the SDK with the management config', async () => {
    const {result} = renderHook(() => useRemoveGroupMember());

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockRemoveGroupMembers).toHaveBeenCalledWith({
      ...config,
      groupId: 'g1',
      members: [{id: 'u1', type: 'user'}],
    });
  });

  it('should refresh the group, its members and the groups list, and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useRemoveGroupMember());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUP, 'g1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUPS]});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUP_MEMBERS, 'g1']});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Request failed');
    mockRemoveGroupMembers.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useRemoveGroupMember());

    result.current.mutate(variables);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
