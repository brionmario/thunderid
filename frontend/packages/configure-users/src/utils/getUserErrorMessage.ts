// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {getErrorMessage} from '@thunderid/utils';

/**
 * The subset of the USR-1027 (blocking dependencies) API error response this util reads.
 */
interface BlockingDependenciesApiError {
  code: string;
  description?: {
    params?: {
      dependencies?: string;
    };
  };
}

const BLOCKING_DEPENDENCIES_ERROR_CODE = 'USR-1027';

const BLOCKING_DEPENDENCIES_DEFAULT_VALUE =
  'This user cannot be deleted because {{dependencies}} depend on it. Remove or reassign them first.';

/**
 * Reads the server's error envelope, which an HTTP client error carries as its response body and an
 * SDK API error (`ThunderIDAPIError`) as `serverError`.
 */
function extractApiError(error: Error): BlockingDependenciesApiError | undefined {
  const candidate = error as Error & {
    response?: {data?: BlockingDependenciesApiError};
    serverError?: BlockingDependenciesApiError;
  };

  return candidate.response?.data ?? candidate.serverError;
}

/**
 * Reads the error code from the server's error envelope, or from the error itself when it has none.
 */
function extractErrorCode(error: Error): string | undefined {
  return extractApiError(error)?.code ?? (error as Error & {code?: string}).code;
}

/**
 * Extracts a localized error message from a user API error response, with a dedicated,
 * actionable message for USR-1027 (blocking dependencies).
 *
 * For USR-1027, builds the message from the error's `dependencies` param, a human-readable
 * summary (e.g. "2 agent(s)") supplied by the backend. Falls back to {@link getErrorMessage} for
 * every other error, and for USR-1027 responses without usable params.
 *
 * @param error - The error thrown by the mutation
 * @param t - The i18next translation function scoped to the relevant namespace
 * @param fallbackKey - i18n key to use when no specific message is found (e.g. `'delete.error'`)
 * @param fallbackDefaultValue - Default string for `fallbackKey`, per the i18n Fallback Values convention
 * @returns Localized error message string
 *
 * @public
 */
export default function getUserErrorMessage(
  error: Error,
  t: (key: string, options?: Record<string, unknown>) => string,
  fallbackKey: string,
  fallbackDefaultValue?: string,
): string {
  const code = extractErrorCode(error);

  if (code === BLOCKING_DEPENDENCIES_ERROR_CODE) {
    const dependencies = extractApiError(error)?.description?.params?.dependencies;

    if (dependencies) {
      return t(`errors.${BLOCKING_DEPENDENCIES_ERROR_CODE}`, {
        dependencies,
        defaultValue: BLOCKING_DEPENDENCIES_DEFAULT_VALUE,
      });
    }

    // Skip the generic code lookup: it would resolve the same errors.USR-1027 key and return its
    // {{dependencies}} placeholder unresolved.
    return fallbackDefaultValue !== undefined ? t(fallbackKey, {defaultValue: fallbackDefaultValue}) : t(fallbackKey);
  }

  return getErrorMessage(error, t, fallbackKey, fallbackDefaultValue);
}
