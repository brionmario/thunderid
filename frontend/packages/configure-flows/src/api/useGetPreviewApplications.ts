// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useQuery, type UseQueryResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {getApplications, type ApplicationListResponse} from '@thunderid/react';

/**
 * Lists the applications the simulation preview can theme itself as. Shares its cache key with the
 * applications feature's list.
 *
 * @returns TanStack Query result with the application list
 */
export default function useGetPreviewApplications(): UseQueryResult<ApplicationListResponse> {
  const config = useManagementApiConfig();

  return useQuery<ApplicationListResponse>({
    queryKey: ['applications', {}],
    queryFn: () => getApplications(config),
  });
}
