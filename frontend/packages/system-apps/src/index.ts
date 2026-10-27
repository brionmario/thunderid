// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

// Constants
export * from './constants/app-catalog';

// Models
export * from './models/app-config';

// Themes
export {
  createAppSdkThemes,
  createAppTheme,
  DEFAULT_APP_THEME,
  resolveAppTheme,
  type AppColorScheme,
  type ResolvedAppTheme,
} from './utils/appTheme';

// Components
export {default as AppBrand, type AppBrandProps} from './components/AppBrand';
