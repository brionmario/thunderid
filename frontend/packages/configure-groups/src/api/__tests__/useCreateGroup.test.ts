// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import GroupQueryKeys from '../../constants/group-query-keys';
import type {CreateGroupRequest} from '../../models/requests';
import useCreateGroup from '../useCreateGroup';

const {config, mockCreateGroup, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockCreateGroup: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({createGroup: mockCreateGroup}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useCreateGroup', () => {
  const payload: CreateGroupRequest = {name: 'Platform team', ouId: 'ou-1', members: [{id: 'u1', type: 'user'}]};
  const created = {id: 'g1', name: 'Platform team', ouId: 'ou-1'};

  beforeEach(() => {
    mockCreateGroup.mockReset();
    mockShowToast.mockReset();
  });

  it('should create the group through the SDK with the management config', async () => {
    mockCreateGroup.mockResolvedValueOnce(created);

    const {result} = renderHook(() => useCreateGroup());

    await expect(result.current.mutateAsync(payload)).resolves.toEqual(created);
    expect(mockCreateGroup).toHaveBeenCalledWith({...config, payload});
  });

  it('should refresh the groups list and confirm with a toast', async () => {
    mockCreateGroup.mockResolvedValueOnce(created);

    const {result, queryClient} = renderHook(() => useCreateGroup());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [GroupQueryKeys.GROUPS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Group already exists');
    mockCreateGroup.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useCreateGroup());

    result.current.mutate(payload);

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
