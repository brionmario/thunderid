// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {describe, expect, it, vi} from 'vitest';
import getUserErrorMessage from '../getUserErrorMessage';

describe('getUserErrorMessage', () => {
  const makeApiError = (code: string, params?: Record<string, string>): Error =>
    Object.assign(new Error('request failed'), {
      response: {data: {code, description: params ? {params} : undefined}},
    });

  it('should interpolate the dependencies param for USR-1027', () => {
    const t = vi.fn((key: string, options?: {dependencies?: string; defaultValue?: string}) =>
      key === 'errors.USR-1027'
        ? `This user cannot be deleted because ${options?.dependencies} depend on it. Remove or reassign them first.`
        : '',
    );

    expect(getUserErrorMessage(makeApiError('USR-1027', {dependencies: '2 agent(s)'}), t, 'delete.error')).toBe(
      'This user cannot be deleted because 2 agent(s) depend on it. Remove or reassign them first.',
    );
  });

  it('should fall back to the generic key for USR-1027 without params, rather than rendering the placeholder', () => {
    const t = vi.fn((key: string, options?: {defaultValue?: string}) =>
      key === 'delete.error' ? (options?.defaultValue ?? 'Failed to delete user.') : '',
    );

    expect(
      getUserErrorMessage(makeApiError('USR-1027'), t, 'delete.error', 'Failed to delete user. Please try again.'),
    ).toBe('Failed to delete user. Please try again.');
  });

  it('should interpolate the dependencies param for USR-1027 carried as an SDK serverError', () => {
    // An SDK API error also carries a code of its own, which must not shadow the server's.
    const error = Object.assign(new Error('request failed'), {
      code: 'deleteUser-ResponseError-001',
      serverError: {code: 'USR-1027', description: {params: {dependencies: '1 agent(s)'}}},
    });
    const t = vi.fn((key: string, options?: {dependencies?: string}) =>
      key === 'errors.USR-1027' ? `Blocked by ${options?.dependencies}.` : '',
    );

    expect(getUserErrorMessage(error, t, 'delete.error')).toBe('Blocked by 1 agent(s).');
  });

  it('should resolve a code reported at the top level of the error', () => {
    const error = Object.assign(new Error('flow failed'), {code: 'USR-1014'});
    const t = vi.fn((key: string) =>
      key === 'errors.USR-1014' ? 'A user with the same unique attribute value already exists.' : '',
    );

    expect(getUserErrorMessage(error, t, 'create.error')).toBe(
      'A user with the same unique attribute value already exists.',
    );
  });

  it('should resolve a top-level code from the shared catalog when the feature namespace has no entry', () => {
    const error = Object.assign(new Error('flow failed'), {code: 'SSE-4030'});
    const t = vi.fn((key: string) =>
      key === 'common:errors.SSE-4030'
        ? 'You do not have permission to perform this action in this organization unit.'
        : '',
    );

    expect(getUserErrorMessage(error, t, 'create.error', 'Failed to create user. Please try again.')).toBe(
      'You do not have permission to perform this action in this organization unit.',
    );
  });

  it('should prefer the feature namespace over the shared catalog for a flow-shaped code', () => {
    const error = Object.assign(new Error('flow failed'), {code: 'SSE-4030'});
    const t = vi.fn((key: string) => {
      if (key === 'errors.SSE-4030') return 'Feature-specific wording.';
      if (key === 'common:errors.SSE-4030') return 'Shared wording.';
      return '';
    });

    expect(getUserErrorMessage(error, t, 'create.error')).toBe('Feature-specific wording.');
  });

  it('should fall back to the fallback key when a flow-shaped code has no mapped translation', () => {
    const t = vi.fn((key: string, options?: {defaultValue?: string}) =>
      key === 'create.error' ? (options?.defaultValue ?? 'Failed to create user.') : '',
    );
    const error = Object.assign(new Error('flow failed'), {code: 'FLM-9999'});

    expect(getUserErrorMessage(error, t, 'create.error', 'Failed to create user. Please try again.')).toBe(
      'Failed to create user. Please try again.',
    );
  });

  it('should delegate to getErrorMessage for a plain REST error with a mapped code', () => {
    const t = vi.fn((key: string) =>
      key === 'errors.USR-1025' ? 'This user is managed declaratively and cannot be edited or deleted.' : '',
    );

    expect(getUserErrorMessage(makeApiError('USR-1025'), t, 'update.error')).toBe(
      'This user is managed declaratively and cannot be edited or deleted.',
    );
  });

  it('should delegate to getErrorMessage for an error with no code at all', () => {
    const t = vi.fn((key: string, options?: {defaultValue?: string}) =>
      key === 'update.error' ? (options?.defaultValue ?? 'Failed to update user.') : '',
    );

    expect(
      getUserErrorMessage(new Error('network error'), t, 'update.error', 'Failed to update user. Please try again.'),
    ).toBe('Failed to update user. Please try again.');
  });
});
