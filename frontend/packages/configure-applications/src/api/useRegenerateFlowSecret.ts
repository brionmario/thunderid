// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {regenerateFlowSecret} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import ApplicationQueryKeys from '../constants/application-query-keys';
import type {Application} from '../models/application';

/**
 * Variables for the {@link useRegenerateFlowSecret} mutation.
 *
 * @public
 */
export interface RegenerateFlowSecretVariables {
  /**
   * The unique identifier of the application whose Flow Secret will be regenerated
   */
  applicationId: string;
}

/**
 * Result of the {@link useRegenerateFlowSecret} mutation.
 *
 * @public
 */
export interface RegenerateFlowSecretResult {
  /**
   * The updated application after Flow Secret regeneration
   */
  application: Application;
  /**
   * The new Flow Secret generated during regeneration. Only available immediately after
   * regeneration and must be saved by the user.
   */
  flowSecret: string;
}

/**
 * Custom React hook to regenerate an application's Flow Secret.
 *
 * Unlike the OAuth client secret, the Flow Secret is a top-level application credential and exists
 * even for embedded server-side apps that carry no OAuth configuration. This hook:
 * 1. Fetches the current application details
 * 2. Generates a new Flow Secret
 * 3. Updates the application with the new Flow Secret via the update API
 *
 * @remarks
 * There is no dedicated regenerate endpoint; the update application endpoint is used. When a
 * dedicated endpoint is added in the backend, this hook can switch to it without UI changes.
 *
 * @returns TanStack Query mutation object for regenerating Flow Secrets
 *
 * @public
 */
export default function useRegenerateFlowSecret(): UseMutationResult<
  RegenerateFlowSecretResult,
  Error,
  RegenerateFlowSecretVariables
> {
  const config = useManagementApiConfig();
  const queryClient = useQueryClient();
  const {t} = useTranslation('applications');
  const {showToast} = useToast();

  return useMutation<RegenerateFlowSecretResult, Error, RegenerateFlowSecretVariables>({
    mutationFn: async ({applicationId}: RegenerateFlowSecretVariables): Promise<RegenerateFlowSecretResult> =>
      (await regenerateFlowSecret({...config, applicationId})) as unknown as RegenerateFlowSecretResult,
    onSuccess: (_data, variables) => {
      queryClient
        .invalidateQueries({queryKey: [ApplicationQueryKeys.APPLICATION, variables.applicationId]})
        .catch(() => {
          // Ignore invalidation errors
        });
      queryClient.invalidateQueries({queryKey: [ApplicationQueryKeys.APPLICATIONS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('regenerateFlowSecret.snackbar.success'), 'success');
    },
  });
}
