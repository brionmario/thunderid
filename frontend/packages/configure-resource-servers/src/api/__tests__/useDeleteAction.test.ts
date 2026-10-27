// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor} from '@testing-library/react';
import {renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import ResourceServerQueryKeys from '../../constants/resource-server-query-keys';
import useDeleteAction from '../useDeleteAction';

const {mockHttpRequest} = vi.hoisted(() => ({mockHttpRequest: vi.fn()}));

vi.mock('@thunderid/react', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useThunderID: () => ({http: {request: mockHttpRequest}}),
}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useConfig: () => ({getServerUrl: () => 'https://localhost:8090'}),
}));

describe('useDeleteAction', () => {
  beforeEach(() => {
    mockHttpRequest.mockReset().mockResolvedValue({});
  });

  it('should delete a resource action and refresh its actions', async () => {
    const {result, queryClient} = renderHook(() => useDeleteAction('rs1', 'r1'));
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('a1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockHttpRequest).toHaveBeenCalledTimes(1);
    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://localhost:8090/resource-servers/rs1/resources/r1/actions/a1',
        method: 'DELETE',
      }),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [ResourceServerQueryKeys.RESOURCE_ACTIONS, 'rs1', 'r1'],
    });
  });

  it('should delete a resource server action and refresh its actions', async () => {
    const {result, queryClient} = renderHook(() => useDeleteAction('rs1'));
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('a1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockHttpRequest).toHaveBeenCalledWith(
      expect.objectContaining({url: 'https://localhost:8090/resource-servers/rs1/actions/a1', method: 'DELETE'}),
    );
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [ResourceServerQueryKeys.SERVER_ACTIONS, 'rs1']});
  });

  it('should surface the error', async () => {
    const error = new Error('Request failed');
    mockHttpRequest.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useDeleteAction('rs1'));

    result.current.mutate('a1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
