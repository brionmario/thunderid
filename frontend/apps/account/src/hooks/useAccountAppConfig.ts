// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {DEFAULT_ACCOUNT_APP_CONFIG, type AppConfig, type AppPageConfig} from '@thunderid/system-apps';
import {ACCOUNT_PAGES, type AccountPage} from '../configs/RouteConfig';

/**
 * The Account App configuration.
 */
export interface AccountAppConfig {
  config: AppConfig;
  /**
   * The configuration of one page. A page the configuration does not name is treated as off.
   */
  page: (key: AccountPage) => AppPageConfig | undefined;
  /**
   * The pages that are on, in navigation order.
   */
  visiblePages: AccountPage[];
}

/**
 * Resolves the Account App's default configuration.
 */
export default function useAccountAppConfig(): AccountAppConfig {
  const config: AppConfig = DEFAULT_ACCOUNT_APP_CONFIG;
  const page = (key: AccountPage): AppPageConfig | undefined =>
    config.pages.find((candidate: AppPageConfig) => candidate.key === key);

  return {
    config,
    page,
    visiblePages: ACCOUNT_PAGES.filter((key: AccountPage) => page(key)?.enabled === true),
  };
}
