// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, useQueryClient, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {useToast} from '@thunderid/contexts';
import {createApplication, type CreateApplicationRequest as SdkCreateApplicationRequest} from '@thunderid/react';
import {useTranslation} from 'react-i18next';
import ApplicationQueryKeys from '../constants/application-query-keys';
import type {Application} from '../models/application';
import type {CreateApplicationRequest} from '../models/requests';

/**
 * Custom React hook to create a new application in the server.
 *
 * This hook uses TanStack Query mutations to handle the application creation process,
 * providing loading states, error handling, and automatic cache invalidation. Upon
 * successful creation, it automatically invalidates the applications list query to
 * trigger a refetch.
 *
 * @returns TanStack Query mutation object for creating applications with mutate function, loading state, and error information
 *
 * @example
 * ```tsx
 * function CreateApplicationForm() {
 *   const createApp = useCreateApplication();
 *
 *   const handleSubmit = (data: CreateApplicationRequest) => {
 *     createApp.mutate(data, {
 *       onSuccess: (application) => {
 *         console.log('Application created:', application);
 *       },
 *       onError: (error) => {
 *         console.error('Failed to create application:', error);
 *       }
 *     });
 *   };
 *
 *   return (
 *     <button onClick={() => handleSubmit(data)} disabled={createApp.isPending}>
 *       {createApp.isPending ? 'Creating...' : 'Create Application'}
 *     </button>
 *   );
 * }
 * ```
 *
 * @public
 */
export default function useCreateApplication(): UseMutationResult<Application, Error, CreateApplicationRequest> {
  const config = useManagementApiConfig();
  const queryClient: ReturnType<typeof useQueryClient> = useQueryClient();
  const {t} = useTranslation('applications');
  const {showToast} = useToast();

  return useMutation<Application, Error, CreateApplicationRequest>({
    mutationFn: async (applicationData: CreateApplicationRequest): Promise<Application> =>
      (await createApplication({
        ...config,
        payload: applicationData as unknown as SdkCreateApplicationRequest,
      })) as unknown as Application,
    onSuccess: () => {
      // Invalidate and refetch applications list after successful creation
      queryClient.invalidateQueries({queryKey: [ApplicationQueryKeys.APPLICATIONS]}).catch(() => {
        // Ignore invalidation errors
      });
      showToast(t('create.success'), 'success');
    },
  });
}
