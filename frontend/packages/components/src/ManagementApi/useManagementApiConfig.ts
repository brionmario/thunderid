// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useConfig} from '@thunderid/contexts';
import {useManagementRequestConfig, type ManagementRequestConfig} from '@thunderid/react';
import {useMemo} from 'react';

/**
 * The request config the SDK's management API functions take in the Console: the Console's own server,
 * and the SDK's fetcher, which sends the signed-in admin's access token.
 *
 * The server is the one the Console manages, not the SDK's `baseUrl`, which names the external issuer
 * when the Console signs in through a trusted issuer. Every call goes to the Console's server.
 *
 * @example
 * ```ts
 * const config = useManagementApiConfig();
 * useQuery({queryKey: [UserQueryKeys.USERS], queryFn: () => getUsers({...config, limit: 10})});
 * ```
 */
export default function useManagementApiConfig(): ManagementRequestConfig {
  const {fetcher} = useManagementRequestConfig('users');
  const {getServerUrl} = useConfig();
  const baseUrl: string = getServerUrl();

  return useMemo(() => ({baseUrl, fetcher}), [baseUrl, fetcher]);
}
