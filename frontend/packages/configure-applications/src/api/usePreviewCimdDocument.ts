// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useMutation, type UseMutationResult} from '@tanstack/react-query';
import {useManagementApiConfig} from '@thunderid/components';
import {previewCimdDocument} from '@thunderid/react';
import type {CimdPreview, CimdPreviewResponse} from '../models/cimd';
import toCimdPreview from '../utils/toCimdPreview';

/**
 * Retrieves and validates a Client ID Metadata Document through `POST /cimd/preview`, returning
 * what the administrator approves. Nothing is stored.
 *
 * @public
 */
export default function usePreviewCimdDocument(): UseMutationResult<CimdPreview, Error, string> {
  const config = useManagementApiConfig();

  return useMutation<CimdPreview, Error, string>({
    mutationFn: async (clientId: string): Promise<CimdPreview> =>
      toCimdPreview((await previewCimdDocument({...config, clientId})) as unknown as CimdPreviewResponse),
  });
}
