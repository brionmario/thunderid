// Copyright 2025 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, userEvent} from '@thunderid/test-utils';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import DashboardLayout from '../DashboardLayout';

const mockNavigate = vi.fn();
const mockUserData = vi.fn();
interface MockUseGetApplicationsResult {
  data?: {
    applications?: {
      clientId?: string;
      name?: string;
      template?: string;
    }[];
  };
  isLoading: boolean;
}

const mockUseGetApplications = vi.fn<(params: unknown) => MockUseGetApplicationsResult>();

vi.mock('@thunderid/configure-applications', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/configure-applications')>()),
  useGetApplications: (params: unknown) => mockUseGetApplications(params),
}));

// Mock ThunderID
vi.mock('@thunderid/react', () => ({
  User: ({children}: {children: (user: unknown) => React.ReactNode}) => children(mockUserData()),
}));

// Mock contexts
vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {
    ...actual,
    useConfig: () => ({
      config: {
        brand: {
          product_name: 'ThunderID',
          favicon: {light: 'assets/images/favicon.ico', dark: 'assets/images/favicon-inverted.ico'},
        },
        client: {client_id: 'CONSOLE'},
      },
    }),
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock Outlet
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
    Link: ({children, to}: {children: React.ReactNode; to: string}) => (
      <a href={to} data-testid="router-link">
        {children}
      </a>
    ),
    useNavigate: () => mockNavigate,
  };
});

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    mockUserData.mockReturnValue({name: 'Test User', email: 'test@example.com'});
    mockUseGetApplications.mockReturnValue({
      data: {applications: []},
      isLoading: false,
    });
  });

  it('renders AppShell layout', () => {
    const {rerender} = render(<DashboardLayout />);
    rerender(<DashboardLayout />);

    // Check that the outlet is rendered
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders Outlet for nested routes', () => {
    render(<DashboardLayout />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toHaveTextContent('Outlet Content');
  });

  it('renders navigation categories', () => {
    render(<DashboardLayout />);

    // Check for category labels
    expect(screen.getByText('navigation:categories.identities')).toBeInTheDocument();
    expect(screen.getByText('navigation:categories.resources')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<DashboardLayout />);

    // Check for navigation items using translation keys
    expect(screen.getByText('navigation:pages.users')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.userTypes')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.applications')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.connections')).toBeInTheDocument();
    expect(screen.getByText('navigation:pages.flows')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<DashboardLayout />);

    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
  });

  it('navigates to the signing-out page when sign out is clicked', async () => {
    const user = userEvent.setup();

    render(<DashboardLayout />);

    // Open the user menu first
    const userMenuTrigger = screen.getByLabelText('Test User');
    await user.click(userMenuTrigger);

    // Click sign out menu item
    const signOutButton = await screen.findByText('common:userMenu.signOut');
    await user.click(signOutButton);

    expect(mockNavigate).toHaveBeenCalledWith('/signing-out');
  });

  it('renders the user profile picture in the account menu when available', () => {
    mockUserData.mockReturnValue({
      name: 'Test User',
      email: 'test@example.com',
      picture: 'https://example.com/avatar.png',
    });

    render(<DashboardLayout />);

    const avatarImages = screen
      .getAllByRole<HTMLImageElement>('img')
      .filter((img) => img.src === 'https://example.com/avatar.png');
    expect(avatarImages.length).toBeGreaterThan(0);
  });

  it('renders with fallback values when user data is missing', () => {
    mockUserData.mockReturnValue(null);

    render(<DashboardLayout />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('renders with undefined user name and email', () => {
    mockUserData.mockReturnValue({name: undefined, email: undefined});

    render(<DashboardLayout />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
  });

  it('navigates to welcome page when welcome menu item is clicked', async () => {
    const user = userEvent.setup();
    render(<DashboardLayout />);

    const userMenuTrigger = screen.getByLabelText('Test User');
    await user.click(userMenuTrigger);

    const welcomeItem = await screen.findByText('common:userMenu.welcome');
    expect(welcomeItem).toBeInTheDocument();
    await user.click(welcomeItem);
  });
});
