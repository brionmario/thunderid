// Copyright 2026 The ThunderID Authors
// SPDX-License-Identifier: Apache-2.0

import {render, screen, userEvent, waitFor} from '@thunderid/test-utils';
import {describe, expect, it, vi} from 'vitest';
import type {CimdPreview} from '../../../../models/cimd';
import ConfigureMcpClientIdentity from '../ConfigureMcpClientIdentity';

// The SDK's API functions send through the management config's fetcher; this one hands each request
// to the recorder below and answers with what it returns.
vi.mock('@thunderid/components', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useManagementApiConfig: () => ({
    baseUrl: 'https://localhost:8090',
    fetcher: async (url: string, init: RequestInit): Promise<Response> => {
      const {data, status = 200} = (await request({
        url,
        method: init.method ?? 'GET',
        data: typeof init.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined,
      })) as {data: unknown; status?: number};

      return new Response(JSON.stringify(data), {status, headers: {'Content-Type': 'application/json'}});
    },
  }),
}));

const CHATGPT_CLIENT_ID = 'https://chatgpt.com/oauth/client.json';
const SECRET_CLIENT_ID = 'https://agents.example.com/secret-client.json';

const KNOWN_CLIENTS = [
  {name: 'ChatGPT', clientId: CHATGPT_CLIENT_ID},
  {name: 'Secret Client', clientId: SECRET_CLIENT_ID},
];

// Stands in for POST /cimd/preview: ChatGPT is a private key JWT client, and the secret client is refused.
const request = vi.fn(({data}: {data: {clientId: string}}) =>
  data.clientId === CHATGPT_CLIENT_ID
    ? Promise.resolve({
        data: {
          name: 'ChatGPT',
          inboundAuthConfig: [
            {
              type: 'oauth2',
              config: {
                clientId: CHATGPT_CLIENT_ID,
                clientIdMetadataDocument: true,
                redirectUris: ['https://chatgpt.com/connector_platform_oauth_redirect'],
                grantTypes: ['authorization_code', 'refresh_token'],
                tokenEndpointAuthMethod: 'private_key_jwt',
                certificate: {type: 'JWKS_URI', value: 'https://chatgpt.com/oauth/jwks.json'},
              },
            },
          ],
        },
      })
    : Promise.resolve({status: 400, data: {code: 'CIMD-1007'}}),
);

const baseProps = {
  preview: null,
  onPreviewChange: vi.fn(),
  onModeChange: vi.fn(),
  onKnownClientSelect: vi.fn(),
};

describe('ConfigureMcpClientIdentity', () => {
  it('shows known clients as tiles before the other options', () => {
    render(<ConfigureMcpClientIdentity {...baseProps} mode={null} knownClients={KNOWN_CLIENTS} />);

    expect(screen.getByText('Known clients')).toBeInTheDocument();
    expect(screen.getByTestId('cimd-known-client-ChatGPT')).toHaveTextContent(/^ChatGPT$/);
    expect(screen.getByText('Another client with a CIMD')).toBeInTheDocument();
    expect(screen.getByText("I'll configure it myself")).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });

  it('hides the known clients group when the template lists none', () => {
    render(<ConfigureMcpClientIdentity {...baseProps} mode={null} />);

    expect(screen.queryByText('Known clients')).not.toBeInTheDocument();
    expect(screen.queryByText('Other clients')).not.toBeInTheDocument();
  });

  it('registers a known client from its validated document when its tile is clicked', async () => {
    const onKnownClientSelect = vi.fn();
    render(
      <ConfigureMcpClientIdentity
        {...baseProps}
        mode={null}
        knownClients={KNOWN_CLIENTS}
        onKnownClientSelect={onKnownClientSelect}
      />,
    );

    await userEvent.click(screen.getByTestId('cimd-known-client-ChatGPT'));

    await waitFor(() =>
      expect(onKnownClientSelect).toHaveBeenCalledWith(
        expect.objectContaining<Partial<CimdPreview>>({
          clientId: CHATGPT_CLIENT_ID,
          clientName: 'ChatGPT',
          tokenEndpointAuthMethod: 'private_key_jwt',
          jwksUri: 'https://chatgpt.com/oauth/jwks.json',
        }),
      ),
    );
  });

  it('shows why a known client could not be registered', async () => {
    const onKnownClientSelect = vi.fn();
    render(
      <ConfigureMcpClientIdentity
        {...baseProps}
        mode={null}
        knownClients={KNOWN_CLIENTS}
        onKnownClientSelect={onKnownClientSelect}
      />,
    );

    await userEvent.click(screen.getByTestId('cimd-known-client-Secret Client'));

    expect(await screen.findByTestId('cimd-known-client-error')).toHaveTextContent(
      "This document contains a client secret, which a metadata document can't carry safely.",
    );
    expect(onKnownClientSelect).not.toHaveBeenCalled();
  });

  it('is not ready until one of the other options is chosen', async () => {
    const onReadyChange = vi.fn();
    render(<ConfigureMcpClientIdentity {...baseProps} mode={null} onReadyChange={onReadyChange} />);

    await waitFor(() => expect(onReadyChange).toHaveBeenLastCalledWith(false));
  });

  it('embeds the metadata document form for another client', () => {
    render(<ConfigureMcpClientIdentity {...baseProps} mode="metadataDocument" />);

    expect(screen.getByTestId('cimd-document-url-input')).toBeInTheDocument();
    expect(screen.queryByText("Enter the client's metadata document")).not.toBeInTheDocument();
  });

  it('is ready at once in manual mode and hides the document form', async () => {
    const onReadyChange = vi.fn();
    render(<ConfigureMcpClientIdentity {...baseProps} mode="manual" onReadyChange={onReadyChange} />);

    await waitFor(() => expect(onReadyChange).toHaveBeenLastCalledWith(true));
    expect(screen.queryByTestId('cimd-document-url-input')).not.toBeInTheDocument();
  });

  it('reports the chosen option', async () => {
    const onModeChange = vi.fn();
    render(<ConfigureMcpClientIdentity {...baseProps} mode={null} onModeChange={onModeChange} />);

    await userEvent.click(screen.getByText("I'll configure it myself"));

    expect(onModeChange).toHaveBeenCalledWith('manual');
  });
});
