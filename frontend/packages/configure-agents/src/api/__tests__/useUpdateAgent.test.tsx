// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentQueryKeys from '../../constants/agent-query-keys';
import type {UpdateAgentRequest} from '../../models/agent';
import useUpdateAgent from '../useUpdateAgent';

const {config, mockUpdateAgent, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockUpdateAgent: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({updateAgent: mockUpdateAgent}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useUpdateAgent', () => {
  const data = {ouId: 'ou-1', type: 'default', description: 'Billing Service'} as UpdateAgentRequest;
  const updated = {id: 'agent-1', ...data};

  beforeEach(() => {
    mockUpdateAgent.mockReset();
    mockShowToast.mockReset();
  });

  it('should update the agent through the SDK with the management config', async () => {
    mockUpdateAgent.mockResolvedValueOnce(updated);

    const {result} = renderHook(() => useUpdateAgent());

    await expect(result.current.mutateAsync({agentId: 'agent-1', data})).resolves.toEqual(updated);
    expect(mockUpdateAgent).toHaveBeenCalledWith({...config, agentId: 'agent-1', payload: data});
  });

  it('should refresh the agent and the agents list, and confirm with a toast', async () => {
    mockUpdateAgent.mockResolvedValueOnce(updated);

    const {result, queryClient} = renderHook(() => useUpdateAgent());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({agentId: 'agent-1', data});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [AgentQueryKeys.AGENT, 'agent-1']});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [AgentQueryKeys.AGENTS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Invalid agent');
    mockUpdateAgent.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useUpdateAgent());

    result.current.mutate({agentId: 'agent-1', data});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
