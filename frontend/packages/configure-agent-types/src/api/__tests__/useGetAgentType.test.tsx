// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentTypeQueryKeys from '../../constants/agentTypeQueryKeys';
import type {ApiAgentType} from '../../models/agent-type';
import useGetAgentType from '../useGetAgentType';

const {config, mockGetAgentType} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockGetAgentType: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getAgentType: mockGetAgentType}));

describe('useGetAgentType', () => {
  const agentType: ApiAgentType = {
    id: 'type-1',
    handle: 'default',
    displayName: 'Default',
    ouId: 'ou-1',
    schema: {name: {type: 'string', required: true}},
  };

  beforeEach(() => {
    mockGetAgentType.mockReset();
  });

  it('should load through the SDK with the management config', async () => {
    mockGetAgentType.mockResolvedValueOnce(agentType);

    const {result, queryClient} = renderHook(() => useGetAgentType('type-1'));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(agentType);
    expect(mockGetAgentType).toHaveBeenCalledWith({...config, agentTypeId: 'type-1'});
    expect(queryClient.getQueryData([AgentTypeQueryKeys.AGENT_TYPE, 'type-1'])).toEqual(agentType);
  });

  it('should not fetch until an id is known', () => {
    const {result} = renderHook(() => useGetAgentType(undefined));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetAgentType).not.toHaveBeenCalled();
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Not found');
    mockGetAgentType.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetAgentType('type-1'));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });
});
