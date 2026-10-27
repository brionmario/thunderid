// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, waitFor} from '@thunderid/test-utils';
import {describe, it, expect, vi, beforeEach} from 'vitest';
import type {Application} from '../../../../models/application';
import EditTokenSettings from '../EditTokenSettings';

// Stable mock references, created via vi.hoisted so the hoisted vi.mock factories can use them.
// New identities on every render would re-fire the schema-fetch effect in a loop.
const managementApiConfig = vi.hoisted(() => ({baseUrl: 'https://api.example.com'}));

const {mockHttp, mockGetServerUrl, mockLogger} = vi.hoisted(() => ({
  mockHttp: {
    request: vi.fn().mockResolvedValue({data: {id: 'schema-1', handle: 'default', displayName: 'Default', schema: {}}}),
  },
  mockGetServerUrl: vi.fn().mockReturnValue('https://api.example.com'),
  mockLogger: {error: vi.fn(), info: vi.fn(), debug: vi.fn()},
}));

vi.mock('@thunderid/configure-user-types', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/configure-user-types')>()),
  useGetUserTypes: () => ({
    data: {types: [{id: 'schema-1', handle: 'default', displayName: 'Default'}]},
    isLoading: false,
  }),
}));

// The SDK reads each user type through the management config's fetcher; route it through the same
// request mock. A stable config keeps fetchSchemas' effect from re-firing on every render.
vi.mock('@thunderid/components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/components')>()),
  useManagementApiConfig: () => managementApiConfig,
}));

vi.mock('@thunderid/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@thunderid/react')>()),
  getUserTypes: async (): Promise<unknown> =>
    ((await mockHttp.request({url: 'https://api.example.com/user-types', method: 'GET'})) as {data: unknown}).data,
  getUserType: async ({userTypeId}: {userTypeId: string}): Promise<unknown> =>
    (
      (await mockHttp.request({url: `https://api.example.com/user-types/${userTypeId}`, method: 'GET'})) as {
        data: unknown;
      }
    ).data,
}));

vi.mock('@thunderid/contexts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/contexts')>();
  return {...actual, useConfig: () => ({getServerUrl: mockGetServerUrl})};
});

vi.mock('@thunderid/logger', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@thunderid/logger')>();
  return {...actual, useLogger: () => mockLogger};
});

const nativeApplication = (assertion?: Application['assertion']): Application =>
  ({id: 'app-1', name: 'App Native App', allowedUserTypes: ['default'], assertion}) as Application;

/**
 * The validity effect runs again whenever one of its dependencies changes identity, which happens in
 * the console under StrictMode's double invocation of effects. By then the first-render guard is
 * already spent, so the effect must decide for itself whether anything actually changed. Re-rendering
 * with a fresh onFieldChange reproduces that second run deterministically.
 *
 * TokenValidationSection is left real so its react-hook-form Controllers mount and report values.
 */
describe('EditTokenSettings assertion change tracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not report an assertion change when the effect re-runs and the validity is unchanged', async () => {
    const application = nativeApplication({validityPeriod: 7200, userAttributes: []});
    const {rerender} = render(<EditTokenSettings application={application} onFieldChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('7200')).toBeInTheDocument();
    });

    const onFieldChange = vi.fn();
    rerender(<EditTokenSettings application={application} onFieldChange={onFieldChange} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('7200')).toBeInTheDocument();
    });
    expect(onFieldChange).not.toHaveBeenCalled();
  });

  it('does not report an assertion change when no validity period is stored', async () => {
    const application = nativeApplication(undefined);
    const {rerender} = render(<EditTokenSettings application={application} onFieldChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('3600')).toBeInTheDocument();
    });

    const onFieldChange = vi.fn();
    rerender(<EditTokenSettings application={application} onFieldChange={onFieldChange} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('3600')).toBeInTheDocument();
    });
    expect(onFieldChange).not.toHaveBeenCalled();
  });
});
