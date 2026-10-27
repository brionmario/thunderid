// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {useConfig} from '@thunderid/contexts';
import {getCspNonce} from '@thunderid/design';
import {createAppSdkThemes, createAppTheme} from '@thunderid/system-apps';
import {createOxygenTheme, OxygenUIThemeProvider, HighContrastTheme} from '@wso2/oxygen-ui';
import {useMemo, type JSX, type ComponentType} from 'react';
import Head from '../components/Head';
import SdkTheme from '../components/SdkTheme';

/**
 * Applies the Admin App's theme to both the app shell and the SDK components. Its sign-in screens
 * take the Gate theme of its application instead.
 */
export default function withTheme<P extends object>(WrappedComponent: ComponentType<P>) {
  return function WithTheme(props: P): JSX.Element {
    const {config} = useConfig();
    const appTheme = useMemo(() => createAppTheme(), []);
    const sdkThemes = useMemo(() => createAppSdkThemes(), []);

    return (
      <OxygenUIThemeProvider
        nonce={getCspNonce()}
        themes={[
          {key: 'highContrast', label: 'High Contrast Theme', theme: HighContrastTheme},
          {key: 'default', label: 'Default Theme', theme: appTheme},
          ...(config?.brand?.design?.themes?.map((theme) => ({
            key: theme.key,
            label: theme.label,
            theme: typeof theme.theme === 'string' ? theme.theme : createOxygenTheme(theme.theme),
          })) ?? []),
        ]}
        initialTheme={config?.brand?.design?.initialTheme ?? 'default'}
      >
        <Head />
        <SdkTheme themes={sdkThemes}>
          <WrappedComponent {...props} />
        </SdkTheme>
      </OxygenUIThemeProvider>
    );
  };
}
