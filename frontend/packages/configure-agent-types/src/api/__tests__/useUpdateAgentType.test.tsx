// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentTypeQueryKeys from '../../constants/agentTypeQueryKeys';
import type {UpdateAgentTypeRequest} from '../../models/requests';
import useUpdateAgentType from '../useUpdateAgentType';

const {config, mockUpdateAgentType, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateAgentType: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateAgentType: mockUpdateAgentType}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateAgentType', () => {
  const data: UpdateAgentTypeRequest = {
    displayName: 'Default',
    ouId: 'ou-1',
    schema: {name: {type: 'string', required: true}},
  };
  const updated = {id: 'type-1', handle: 'default', ...data};

  beforeEach(() => {
    mockUpdateAgentType.mockReset();
    mockShowToast.mockReset();
  });

  it('should update the agent type through the SDK with the management config', async () => {
    mockUpdateAgentType.mockResolvedValueOnce(updated);

    const {result} = renderHook(() => useUpdateAgentType());

    await expect(result.current.mutateAsync({agentTypeId: 'type-1', data})).resolves.toEqual(updated);
    expect(mockUpdateAgentType).toHaveBeenCalledWith({...config, agentTypeId: 'type-1', payload: data});
  });

  it('should refresh the agent type and the list, and confirm with a toast', async () => {
    mockUpdateAgentType.mockResolvedValueOnce(updated);

    const {result, queryClient} = renderHook(() => useUpdateAgentType());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({agentTypeId: 'type-1', data});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [AgentTypeQueryKeys.AGENT_TYPE, 'type-1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [AgentTypeQueryKeys.AGENT_TYPES]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Invalid schema');
    mockUpdateAgentType.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateAgentType());

    result.current.mutate({agentTypeId: 'type-1', data});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
