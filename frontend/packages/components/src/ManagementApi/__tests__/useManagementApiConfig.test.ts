// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {renderHook} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import useManagementApiConfig from '../useManagementApiConfig';

const mockFetcher = vi.fn();

vi.mock('@thunderid/react', () => ({
  useManagementRequestConfig: () => ({baseUrl: 'https://issuer.example', fetcher: mockFetcher, url: undefined}),
}));

vi.mock('@thunderid/contexts', () => ({
  useConfig: () => ({getServerUrl: () => 'https://localhost:8090'}),
}));

describe('useManagementApiConfig', () => {
  it("calls the Console's own server with the SDK's authenticated fetcher", () => {
    const {result} = renderHook((): unknown => useManagementApiConfig());

    expect(result.current).toEqual({baseUrl: 'https://localhost:8090', fetcher: mockFetcher});
  });
});
