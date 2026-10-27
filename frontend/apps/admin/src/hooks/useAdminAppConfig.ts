// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useGrantedPermissions} from '@thunderid/react';
import {
  ADMIN_APP_PAGES,
  DEFAULT_ADMIN_APP_CONFIG,
  type AppPageDefinition,
  type AppConfig,
  type AppPageConfig,
} from '@thunderid/system-apps';
import {MANAGED_RESOURCES, type ManagedResource} from '../configs/RouteConfig';

/**
 * The Admin App configuration, resolved for the signed-in admin.
 */
export interface AdminAppConfig {
  config: AppConfig;
  /**
   * Whether the admin's permissions are still loading.
   */
  isLoading: boolean;
  /**
   * The configuration of one page. A page the configuration does not name is treated as off.
   */
  page: (resource: ManagedResource) => AppPageConfig | undefined;
  /**
   * The pages to show this admin, in navigation order: the pages that are on, less the ones that
   * need a permission the admin's token does not carry.
   */
  visibleResources: ManagedResource[];
}

/**
 * Resolves the Admin App's default configuration for the signed-in admin.
 */
export default function useAdminAppConfig(): AdminAppConfig {
  const {can, isLoading} = useGrantedPermissions();
  const config: AppConfig = DEFAULT_ADMIN_APP_CONFIG;
  const page = (resource: ManagedResource): AppPageConfig | undefined =>
    config.pages.find((candidate: AppPageConfig) => candidate.key === resource);

  const isVisible = (resource: ManagedResource): boolean => {
    const pageConfig: AppPageConfig | undefined = page(resource);

    if (pageConfig?.enabled !== true) {
      return false;
    }

    if (pageConfig.visibility !== 'BY_PERMISSION') {
      return true;
    }

    const definition: AppPageDefinition | undefined = ADMIN_APP_PAGES.find(
      (candidate: AppPageDefinition) => candidate.key === resource,
    );

    return definition?.permission ? can(definition.permission) : false;
  };

  return {
    config,
    isLoading,
    page,
    visibleResources: MANAGED_RESOURCES.filter(isVisible),
  };
}
