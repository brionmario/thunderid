// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen} from '@testing-library/react';
import type {JSX, ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import withTheme from '../hocs/withTheme';

vi.mock('@thunderid/contexts', () => ({
  useConfig: () => ({config: {brand: {favicon: {dark: 'dark.ico', light: 'light.ico'}}}}),
}));

vi.mock('@thunderid/react', () => ({
  ThemeProvider: ({children, mode, theme}: {children: ReactNode; mode: string; theme: unknown}): JSX.Element => (
    <div data-testid="sdk-theme" data-mode={mode} data-theme={JSON.stringify(theme ?? null)}>
      {children}
    </div>
  ),
}));

vi.mock('../components/Head', () => ({default: (): null => null}));

function App(): JSX.Element {
  return <p>app</p>;
}

const Themed = withTheme(App);

describe('withTheme', () => {
  it("gives the app and the SDK components the Account App's own look", () => {
    render(<Themed />);

    const sdkTheme: HTMLElement = screen.getByTestId('sdk-theme');
    expect(screen.getByText('app')).toBeTruthy();
    expect(sdkTheme.getAttribute('data-mode')).toBe('light');
    expect(sdkTheme.getAttribute('data-theme')).toContain('#3688FF');
  });
});
