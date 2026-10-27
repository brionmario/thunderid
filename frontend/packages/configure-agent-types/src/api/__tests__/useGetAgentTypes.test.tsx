// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentTypeQueryKeys from '../../constants/agentTypeQueryKeys';
import type {AgentTypeListResponse} from '../../models/responses';
import useGetAgentTypes from '../useGetAgentTypes';

const {config, mockList} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockList: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({getAgentTypes: mockList}));

describe('useGetAgentTypes', () => {
  const response: AgentTypeListResponse = {
    totalResults: 1,
    startIndex: 1,
    count: 1,
    types: [{id: 'type-1', handle: 'default', displayName: 'Default', ouId: 'ou-1', ouHandle: 'root'}],
  };

  beforeEach(() => {
    mockList.mockReset();
  });

  it('should start in the loading state', () => {
    mockList.mockReturnValue(new Promise(() => null));

    const {result} = renderHook(() => useGetAgentTypes());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should load through the SDK with the management config', async () => {
    mockList.mockResolvedValueOnce(response);

    const {result} = renderHook(() => useGetAgentTypes());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(response);
    expect(mockList).toHaveBeenCalledWith({...config, limit: undefined, offset: undefined});
  });

  it('should pass the paging params through and cache each page under its own key', async () => {
    mockList.mockResolvedValueOnce(response);

    const {result, queryClient} = renderHook(() => useGetAgentTypes({limit: 10, offset: 20}));

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockList).toHaveBeenCalledWith({...config, limit: 10, offset: 20});
    expect(queryClient.getQueryData([AgentTypeQueryKeys.AGENT_TYPES, {limit: 10, offset: 20}])).toEqual(response);
  });

  it('should surface the error the SDK throws', async () => {
    const error = new Error('Failed to fetch');
    mockList.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useGetAgentTypes());

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('should not fetch when disabled', () => {
    const {result} = renderHook(() => useGetAgentTypes(undefined, {enabled: false}));

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockList).not.toHaveBeenCalled();
  });
});
