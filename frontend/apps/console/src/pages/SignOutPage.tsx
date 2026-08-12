// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {PageLoader} from '@thunderid/components';
import {useConfig} from '@thunderid/contexts';
import {useLogger} from '@thunderid/logger/react';
import {useThunderID} from '@thunderid/react';
import {useEffect, useRef, type JSX} from 'react';
import {useNavigate} from 'react-router';
import RouteConfig from '../configs/RouteConfig';

/**
 * Landing point for sign out, in both directions:
 *
 * - Reached by navigating here directly (still signed in): starts the actual sign-out request
 *   (RP-Initiated Logout's redirect through the OP, or a generic OIDC IdP logout) while showing a
 *   spinner, instead of the click handler triggering a `location.href` change straight from the
 *   dashboard.
 * - Reached again once the OP redirects back here (`afterSignOutUrl`/`post_logout_redirect_uri`
 *   both point at this route): the session is already clear, so it moves on to the home route,
 *   which sends a signed-out user to sign in.
 *
 * Landing back on this route rather than the dashboard root avoids the flash of protected content
 * that ProtectedRoute's own immediate re-sign-in redirect would otherwise cause.
 */
export default function SignOutPage(): JSX.Element {
  const {isLoading, isSignedIn, signOut, clearSession, discovery} = useThunderID();
  const {isTrustedIssuerGenericOidc, getTrustedIssuerClientId, getClientUrl} = useConfig();
  const logger = useLogger();
  const navigate = useNavigate();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (isLoading || hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;

    if (!isSignedIn) {
      // Landed back here once the OP confirmed sign out; the session is already clear.
      void navigate(RouteConfig.home.list());
      return;
    }

    if (isTrustedIssuerGenericOidc()) {
      try {
        clearSession();
      } catch (error: unknown) {
        logger.error('Failed to clear local session before IdP sign out', {error});
      }

      const endSessionEndpoint = discovery?.wellKnown?.end_session_endpoint;
      if (!endSessionEndpoint) {
        logger.warn('end_session_endpoint missing from IdP discovery document; ending local session only');
        // eslint-disable-next-line react-hooks/immutability
        window.location.href = getClientUrl();
        return;
      }

      const logoutUrl = new URL(endSessionEndpoint);
      logoutUrl.searchParams.set('client_id', getTrustedIssuerClientId());
      logoutUrl.searchParams.set('post_logout_redirect_uri', getClientUrl());
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = logoutUrl.toString();
      return;
    }

    // Native ThunderID session: signOut() performs OIDC RP-Initiated Logout, the SDK's default
    // behavior (no client config required). It clears the local session and redirects to ThunderID's
    // end_session_endpoint, which confirms the sign-out, terminates the SSO session server-side, and
    // returns here (afterSignOutUrl points at this same route). It falls back to a local-only sign
    // out when no end_session_endpoint is advertised.
    signOut().catch((error: unknown) => {
      logger.error('Sign out failed', {error});
    });
  }, [
    clearSession,
    discovery,
    getClientUrl,
    getTrustedIssuerClientId,
    isLoading,
    isSignedIn,
    isTrustedIssuerGenericOidc,
    logger,
    navigate,
    signOut,
  ]);

  return <PageLoader />;
}
