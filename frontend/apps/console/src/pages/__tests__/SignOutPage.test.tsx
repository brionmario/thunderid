// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, waitFor} from '@thunderid/test-utils';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import SignOutPage from '../SignOutPage';

const mockNavigate = vi.fn();
const mockSignOut = vi.fn();
const mockClearSession = vi.fn();
const mockLoggerError = vi.fn();
const mockLoggerWarn = vi.fn();

let mockDiscovery: {wellKnown?: {end_session_endpoint?: string}} | undefined;
let mockIsTrustedIssuerGenericOidc = false;
let mockIsLoading = false;
let mockIsSignedIn = true;

vi.mock('@thunderid/react', () => ({
  useThunderID: () => ({
    clearSession: mockClearSession,
    discovery: mockDiscovery,
    isLoading: mockIsLoading,
    isSignedIn: mockIsSignedIn,
    signOut: mockSignOut,
  }),
}));

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {
    ...actual,
    useConfig: () => ({
      getClientUrl: () => 'https://localhost:5191/console',
      getTrustedIssuerClientId: () => 'test-client-id',
      isTrustedIssuerGenericOidc: () => mockIsTrustedIssuerGenericOidc,
    }),
  };
});

vi.mock('@thunderid/logger/react', () => ({
  useLogger: () => ({
    debug: vi.fn(),
    error: mockLoggerError,
    info: vi.fn(),
    warn: mockLoggerWarn,
  }),
}));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SignOutPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsTrustedIssuerGenericOidc = false;
    mockDiscovery = undefined;
    mockIsLoading = false;
    mockIsSignedIn = true;
  });

  it('renders a loading spinner', () => {
    mockSignOut.mockResolvedValue(undefined);

    render(<SignOutPage />);

    expect(screen.getByLabelText('Loading content')).toBeInTheDocument();
  });

  it('waits for the auth state to settle before acting', () => {
    mockIsLoading = true;

    render(<SignOutPage />);

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('calls signOut for a native ThunderID session while still signed in', async () => {
    mockSignOut.mockResolvedValue(undefined);

    render(<SignOutPage />);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  it('navigates home once landed back here with the session already cleared', () => {
    mockIsSignedIn = false;

    render(<SignOutPage />);

    expect(mockNavigate).toHaveBeenCalledWith('/home');
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('logs error when signOut fails', async () => {
    const signOutError = new Error('Sign out failed');
    mockSignOut.mockRejectedValue(signOutError);

    render(<SignOutPage />);

    await waitFor(() => {
      expect(mockLoggerError).toHaveBeenCalledWith('Sign out failed', {error: signOutError});
    });
  });

  describe('generic OIDC sign out', () => {
    let originalLocation: Location;

    beforeEach(() => {
      mockIsTrustedIssuerGenericOidc = true;
      originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: {...originalLocation, href: ''},
        writable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
        writable: true,
      });
    });

    it('clears local session and redirects to client URL when end_session_endpoint is missing', async () => {
      mockDiscovery = {wellKnown: {}};

      render(<SignOutPage />);

      await waitFor(() => {
        expect(mockClearSession).toHaveBeenCalled();
        expect(mockLoggerWarn).toHaveBeenCalledWith(expect.stringContaining('end_session_endpoint missing'));
        expect(window.location.href).toBe('https://localhost:5191/console');
      });
    });

    it('clears local session and redirects to IdP end_session_endpoint when available', async () => {
      mockDiscovery = {wellKnown: {end_session_endpoint: 'https://idp.example.com/logout'}};

      render(<SignOutPage />);

      await waitFor(() => {
        expect(mockClearSession).toHaveBeenCalled();
        expect(window.location.href).toContain('https://idp.example.com/logout');
        expect(window.location.href).toContain('client_id=test-client-id');
      });
    });

    it('logs error when clearSession throws during generic OIDC sign out', async () => {
      mockDiscovery = {wellKnown: {end_session_endpoint: 'https://idp.example.com/logout'}};
      const sessionError = new Error('session clear failed');
      mockClearSession.mockImplementation(() => {
        throw sessionError;
      });

      render(<SignOutPage />);

      await waitFor(() => {
        expect(mockLoggerError).toHaveBeenCalledWith(expect.stringContaining('Failed to clear local session'), {
          error: sessionError,
        });
      });
    });
  });
});
