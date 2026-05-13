/**
 * Copyright (c) 2026, WSO2 LLC. (https://www.wso2.com).
 *
 * WSO2 LLC. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import {useToast} from '@thunderid/contexts';
import {useLogger} from '@thunderid/logger/react';
import {Alert, Box, Button, Chip, Divider, Stack, TextField, Typography} from '@wso2/oxygen-ui';
import {useCallback, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import useUpdateResourceServer from '@/api/useUpdateResourceServer';
import type {ResourceServer} from '@/models/resource-server';

interface SettingsTabProps {
  resourceServer: ResourceServer;
  onRefresh: () => void;
}

export default function SettingsTab({resourceServer, onRefresh}: SettingsTabProps): JSX.Element {
  const {t} = useTranslation();
  const {showToast} = useToast();
  const logger = useLogger('SettingsTab');
  const updateRs = useUpdateResourceServer();

  const [name, setName] = useState(resourceServer.name);
  const [description, setDescription] = useState(resourceServer.description ?? '');
  const [identifier, setIdentifier] = useState(resourceServer.identifier ?? '');
  const [dirty, setDirty] = useState(false);

  const resetForm = useCallback(() => {
    setName(resourceServer.name);
    setDescription(resourceServer.description ?? '');
    setIdentifier(resourceServer.identifier ?? '');
    setDirty(false);
  }, [resourceServer]);

  const handleSave = (): void => {
    updateRs.mutate(
      {id: resourceServer.id, data: {name, description: description || null, identifier: identifier || null}},
      {
        onSuccess: () => {
          showToast(t('apis:settings.saved', 'Settings saved.'), 'success');
          setDirty(false);
          onRefresh();
        },
        onError: (err: Error) => {
          logger.error('Failed to update API settings', {error: err});
          showToast(t('apis:settings.saveError', 'Failed to save settings.'), 'error');
        },
      },
    );
  };

  return (
    <Box sx={{maxWidth: 640}}>
      {resourceServer.isReadOnly && (
        <Alert severity="warning" sx={{mb: 3}}>
          {t('apis:settings.readOnly', 'This API represents a system entity and cannot be modified or deleted. You can still manage its permissions.')}
        </Alert>
      )}

      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{mb: 2}}>
            {t('apis:settings.general', 'General Settings')}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label={t('apis:settings.fields.name', 'Name')}
              value={name}
              onChange={(e) => {setName(e.target.value); setDirty(true);}}
              fullWidth
              size="small"
              disabled={resourceServer.isReadOnly}
            />
            <TextField
              label={t('apis:settings.fields.description', 'Description')}
              value={description}
              onChange={(e) => {setDescription(e.target.value); setDirty(true);}}
              fullWidth
              size="small"
              multiline
              rows={3}
              disabled={resourceServer.isReadOnly}
            />
            <TextField
              label={t('apis:settings.fields.identifier', 'Identifier (Audience)')}
              value={identifier}
              onChange={(e) => {setIdentifier(e.target.value); setDirty(true);}}
              fullWidth
              size="small"
              helperText={t('apis:settings.fields.identifierHint', 'Used as the audience parameter on authorization calls.')}
              disabled={resourceServer.isReadOnly}
            />
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" sx={{mb: 2}}>
            {t('apis:settings.immutable', 'Immutable Properties')}
          </Typography>
          <Stack direction="row" spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('apis:settings.fields.handle', 'Handle')}
              </Typography>
              <Box sx={{mt: 0.5}}>
                <Chip label={resourceServer.handle} size="small" sx={{fontFamily: 'monospace'}} />
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('apis:settings.fields.delimiter', 'Delimiter')}
              </Typography>
              <Box sx={{mt: 0.5}}>
                <Chip label={resourceServer.delimiter} size="small" sx={{fontFamily: 'monospace'}} />
              </Box>
            </Box>
          </Stack>
        </Box>
      </Stack>

      {!resourceServer.isReadOnly && dirty && (
        <Box sx={{mt: 3, display: 'flex', gap: 1}}>
          <Button variant="outlined" onClick={resetForm} disabled={updateRs.isPending}>
            {t('common:discard', 'Discard')}
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={updateRs.isPending}>
            {updateRs.isPending ? t('common:saving', 'Saving…') : t('common:save', 'Save')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
