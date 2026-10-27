// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentQueryKeys from '../../constants/agent-query-keys';
import type {Agent} from '../../models/agent';
import useGetAgent from '../useGetAgent';

const {config, mockGetAgent} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetAgent: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getAgent: mockGetAgent}));

describe('useGetAgent', () => {
  const agent: Agent = {id: 'agent-1', ouId: 'ou-1', type: 'default', display: 'Billing Service'};

  beforeEach(() => {
    mockGetAgent.mockReset();
  });

  it('should load through the SDK with the management config', async () => {
    mockGetAgent.mockResolvedValueOnce(agent);

    const {result, queryClient} = renderHook(() => useGetAgent('agent-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(agent);
    expect(mockGetAgent).toHaveBeenCalledWith({...config, agentId: 'agent-1'});
    expect(queryClient.getQueryData([AgentQueryKeys.AGENT, 'agent-1'])).toEqual(agent);
  });

  it('should not fetch until an id is known', () => {
    const {result} = renderHook(() => useGetAgent(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetAgent).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Not found');
    mockGetAgent.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetAgent('agent-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
