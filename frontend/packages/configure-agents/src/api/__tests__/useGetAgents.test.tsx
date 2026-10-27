// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentQueryKeys from '../../constants/agent-query-keys';
import type {AgentListResponse} from '../../models/agent';
import useGetAgents from '../useGetAgents';

const {config, mockGetAgents} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetAgents: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getAgents: mockGetAgents}));

describe('useGetAgents', () => {
  const response: AgentListResponse = {
    totalResults: 2,
    startIndex: 0,
    count: 2,
    agents: [
      {id: 'agent-1', ouId: 'ou-1', type: 'default', display: 'Agent 1'},
      {id: 'agent-2', ouId: 'ou-1', type: 'default', display: 'Agent 2'},
    ],
  };

  beforeEach(() => {
    mockGetAgents.mockReset();
  });

  it('should start in the loading state', () => {
    mockGetAgents.mockReturnValue(new Promise(() => null));

    const {result} = renderHook(() => useGetAgents());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should load the first page through the SDK with the management config', async () => {
    mockGetAgents.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetAgents());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockGetAgents).toHaveBeenCalledWith({...config, limit: 30, offset: 0});
  });

  it('should pass the paging params through and cache each page under its own key', async () => {
    mockGetAgents.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetAgents({limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockGetAgents).toHaveBeenCalledWith({...config, limit: 10, offset: 20});
    expect(queryClient.getQueryData([AgentQueryKeys.AGENTS, {limit: 10, offset: 20}])).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch agents');
    mockGetAgents.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetAgents());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
