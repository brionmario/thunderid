// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {regenerateClientSecret} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import ApplicationQueryKeys from '../constants/application-query-keys';
import type {Application} from '../models/application';

/**
 * Variables for the {@link useRegenerateClientSecret} mutation.
 *
 * @public
 */
export interface RegenerateSecretVariables {
  /**
   * The unique identifier of the application whose client secret will be regenerated
   */
  applicationId: string;
}

/**
 * Result of the {@link useRegenerateClientSecret} mutation.
 *
 * @public
 */
export interface RegenerateSecretResult {
  /**
   * The updated application after client secret regeneration.
   */
  application?: Application;
  /**
   * The new client secret generated during regeneration
   * This is only available immediately after regeneration and should be saved by the user
   */
  clientSecret: string;
}

/**
 * Custom React hook to regenerate an application's client secret.
 *
 * Generates a new client secret, saves it on the application through the update API and returns
 * both. Upon successful regeneration, the cache is invalidated to ensure the UI reflects the latest
 * changes.
 *
 * @remarks
 * An application without an OAuth 2 client is refused, so no unusable secret is shown.
 *
 * @returns TanStack Query mutation object for regenerating client secrets with mutate function, loading state, and error information
 *
 * @example
 * ```tsx
 * function RegenerateButton({ applicationId }: { applicationId: string }) {
 *   const regenerateSecret = useRegenerateClientSecret();
 *
 *   const handleRegenerate = () => {
 *     regenerateSecret.mutate(
 *       { applicationId },
 *       {
 *         onSuccess: ({ application, clientSecret }) => {
 *           // Only log the non-sensitive identifier, never log the secret itself
 *           console.log('Client secret regenerated for:', application.id);
 *           // Display the new client secret to the user in a secure dialog
 *           // e.g.: showSecretModal(application.id, clientSecret);
 *           void clientSecret; // Secret must be handled by the UI, not logged
 *         },
 *         onError: (error) => {
 *           console.error('Failed to regenerate client secret:', error);
 *         }
 *       }
 *     );
 *   };
 *
 *   return (
 *     <button onClick={handleRegenerate} disabled={regenerateSecret.isPending}>
 *       {regenerateSecret.isPending ? 'Regenerating...' : 'Regenerate Client Secret'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @public
 */
export default function useRegenerateClientSecret(): UseMutationResult<
  RegenerateSecretResult,
  Error,
  RegenerateSecretVariables
> {
  const config = useManagementApiConfig();
  const queryClient = useQueryClient();
  const {t} = useTranslation('applications');
  const {showToast} = useToast();

  return useMutation<RegenerateSecretResult, Error, RegenerateSecretVariables>({
    mutationFn: async ({applicationId}: RegenerateSecretVariables): Promise<RegenerateSecretResult> => {
      return (await regenerateClientSecret({...config, applicationId})) as unknown as RegenerateSecretResult;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch the specific application
      queryClient
        .invalidateQueries({queryKey: [ApplicationQueryKeys.APPLICATION, variables.applicationId]})
        .catch(() => {
          // Ignore invalidation errors
        });
      // Invalidate and refetch applications list
      queryClient.invalidateQueries({queryKey: [ApplicationQueryKeys.APPLICATIONS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('regenerateSecret.snackbar.success'), 'success');
    },
  });
}
