// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getApplication, type Application} from '@thunderid/react';

/**
 * Reads the application the simulation preview is themed as. Shares its cache key with the
 * applications feature.
 *
 * @param applicationId - The application to read; nothing is fetched while it is empty
 * @returns TanStack Query result with the application
 */
export default function useGetPreviewApplication(applicationId: string): UseQueryResult<Application> {
  const config = useManagementApiConfig();

  return useQuery<Application>({
    queryKey: ['application', applicationId],
    queryFn: () => getApplication({...config, applicationId}),
    enabled: Boolean(applicationId),
  });
}
