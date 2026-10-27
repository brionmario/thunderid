// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useConfig} from '@thunderid/contexts';
import {useThunderID} from '@thunderid/react';
import ResourceServerQueryKeys from '../constants/resource-server-query-keys';

/**
 * Custom React hook to delete an action of a resource server or one of its resources.
 *
 * @returns TanStack Query mutation object for deleting actions
 */
export default function useDeleteAction(
  resourceServerId: string,
  resourceId?: string,
): UseMutationResult<void, Error, string> {
  const {http} = useThunderID();
  const {getServerUrl} = useConfig();
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (actionId: string): Promise<void> => {
      const serverUrl: string = getServerUrl();

      await http.request({
        url: resourceId
          ? `${serverUrl}/resource-servers/${resourceServerId}/resources/${resourceId}/actions/${actionId}`
          : `${serverUrl}/resource-servers/${resourceServerId}/actions/${actionId}`,
        method: 'DELETE',
      } as unknown as Parameters<typeof http.request>[0]);
    },
    onSuccess: () => {
      if (resourceId) {
        void queryClient.invalidateQueries({
          queryKey: [ResourceServerQueryKeys.RESOURCE_ACTIONS, resourceServerId, resourceId],
        });
      } else {
        void queryClient.invalidateQueries({
          queryKey: [ResourceServerQueryKeys.SERVER_ACTIONS, resourceServerId],
        });
      }
    },
  });
}
