// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {renderHook} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import useAdminAppConfig from '../hooks/useAdminAppConfig';

const mockState: {permissionsLoading: boolean} = {permissionsLoading: false};

vi.mock('@thunderid/react', () => ({
  useGrantedPermissions: () => ({
    can: () => false,
    isLoading: mockState.permissionsLoading,
    permissions: [],
  }),
}));

describe('useAdminAppConfig', () => {
  beforeEach(() => {
    mockState.permissionsLoading = false;
  });

  it('shows every page of the default configuration', () => {
    const {result} = renderHook(() => useAdminAppConfig());

    expect(result.current.visibleResources).toEqual(['users', 'groups', 'roles', 'agents']);
  });

  it('allows every action but deleting', () => {
    const {result} = renderHook(() => useAdminAppConfig());

    expect(result.current.page('users')?.actions).toEqual({create: true, delete: false, edit: true, invite: true});
  });

  it('reports loading while the permissions are read', () => {
    mockState.permissionsLoading = true;

    const {result} = renderHook(() => useAdminAppConfig());

    expect(result.current.isLoading).toBe(true);
  });
});
