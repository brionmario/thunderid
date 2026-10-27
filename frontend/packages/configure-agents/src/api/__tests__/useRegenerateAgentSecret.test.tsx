// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {waitFor, renderHook} from '@thunderid/test-utils';
import {describe, it, expect, beforeEach, vi} from 'vitest';
import AgentQueryKeys from '../../constants/agent-query-keys';
import useRegenerateAgentSecret from '../useRegenerateAgentSecret';

const {config, mockRegenerateAgentSecret, mockShowToast} = vi.hoisted(() => ({
  config: {baseUrl: 'https://api.test.com', fetcher: vi.fn()},
  mockRegenerateAgentSecret: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@thunderid/components', () => ({useManagementApiConfig: () => config}));
vi.mock('@thunderid/react', () => ({regenerateAgentSecret: mockRegenerateAgentSecret}));
vi.mock('@thunderid/contexts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/contexts')>()),
  useToast: () => ({showToast: mockShowToast}),
}));

describe('useRegenerateAgentSecret', () => {
  const agentId = 'agent-1';
  const rotated = {agent: {id: agentId, ouId: 'ou-1', type: 'default'}, clientSecret: 'new-secret'};

  beforeEach(() => {
    mockRegenerateAgentSecret.mockReset().mockResolvedValue(rotated);
    mockShowToast.mockReset();
  });

  it('should regenerate the secret through the SDK with the management config', async () => {
    const {result} = renderHook(() => useRegenerateAgentSecret());

    await expect(result.current.mutateAsync({agentId})).resolves.toEqual(rotated);
    expect(mockRegenerateAgentSecret).toHaveBeenCalledWith({...config, agentId});
  });

  it('should refresh the agent and the agents list and confirm with a toast', async () => {
    const {result, queryClient} = renderHook(() => useRegenerateAgentSecret());
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({agentId});

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [AgentQueryKeys.AGENT, agentId]});
    expect(invalidateQueries).toHaveBeenCalledWith({queryKey: [AgentQueryKeys.AGENTS]});
    expect(mockShowToast).toHaveBeenCalledWith(expect.any(String), 'success');
  });

  // The SDK refuses an agent without an OAuth client, so no unusable secret reaches the dialog.
  it('should surface a refusal without a toast', async () => {
    const error = Object.assign(new Error('no OAuth client'), {code: 'regenerateAgentSecret-ValidationError-001'});
    mockRegenerateAgentSecret.mockRejectedValueOnce(error);

    const {result} = renderHook(() => useRegenerateAgentSecret());

    result.current.mutate({agentId});

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
