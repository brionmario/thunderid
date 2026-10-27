// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentQueryKeys from '../../constants/agent-query-keys';
import useDeleteAgent from '../useDeleteAgent';

const {config, mockDeleteAgent, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockDeleteAgent: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({deleteAgent: mockDeleteAgent}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useDeleteAgent', () => {
  beforeEach(() => {
    mockDeleteAgent.mockReset().mockResolvedValue(undefined);
    mockShowToast.mockReset();
  });

  it('should delete the agent through the SDK with the management config', async () => {
    const {result} = renderHook(() => useDeleteAgent());

    result.current.mutate('agent-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockDeleteAgent).toHaveBeenCalledWith({...config, agentId: 'agent-1'});
  });

  it('should drop the agent, refresh the agents list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useDeleteAgent());
    queryClient.setQueryData([AgentQueryKeys.AGENT, 'agent-1'], {id: 'agent-1'});
    queryClient.setQueryData([AgentQueryKeys.AGENT, 'agent-2'], {id: 'agent-2'});
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate('agent-1');

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData([AgentQueryKeys.AGENT, 'agent-1'])).toBeUndefined();
    expect(queryClient.getQueryData([AgentQueryKeys.AGENT, 'agent-2'])).toEqual({id: 'agent-2'});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [AgentQueryKeys.AGENTS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  it('should surface the error without a toast', async () => {
    const error = new Error('Agent is in use');
    mockDeleteAgent.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useDeleteAgent());

    result.current.mutate('agent-1');

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
