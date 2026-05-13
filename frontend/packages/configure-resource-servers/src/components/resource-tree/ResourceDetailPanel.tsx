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
import type {SelectedNode} from './ResourceTree';
import useUpdateAction from '@/api/useUpdateAction';
import useUpdateResource from '@/api/useUpdateResource';
import useUpdateResourceServer from '@/api/useUpdateResourceServer';
import type {ResourceServer} from '@/models/resource-server';

interface ResourceDetailPanelProps {
  selectedNode: SelectedNode | null;
  resourceServer: ResourceServer;
  onRefresh: () => void;
}

function deriveInitialValues(node: SelectedNode | null): {name: string; description: string; identifier: string} {
  if (!node) return {name: '', description: '', identifier: ''};
  if (node.type === 'server') {
    const rs = node.data;
    return {name: rs.name, description: rs.description ?? '', identifier: rs.identifier ?? ''};
  }
  const item = node.data;
  return {name: item.name, description: item.description ?? '', identifier: ''};
}

interface DetailFormProps {
  selectedNode: SelectedNode;
  resourceServer: ResourceServer;
  onRefresh: () => void;
}

function DetailForm({selectedNode, resourceServer, onRefresh}: DetailFormProps): JSX.Element {
  const {t} = useTranslation();
  const {showToast} = useToast();
  const logger = useLogger('ResourceDetailPanel');

  const initial = deriveInitialValues(selectedNode);
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [identifier, setIdentifier] = useState(initial.identifier);
  const [dirty, setDirty] = useState(false);

  const updateRs = useUpdateResourceServer();
  const updateResource = useUpdateResource(resourceServer.id);
  const updateServerAction = useUpdateAction(resourceServer.id);
  const updateResourceAction = useUpdateAction(
    resourceServer.id,
    selectedNode.type === 'resource-action' ? (selectedNode.parentResourceId ?? undefined) : undefined,
  );

  const resetForm = useCallback(() => {
    const vals = deriveInitialValues(selectedNode);
    setName(vals.name);
    setDescription(vals.description);
    setIdentifier(vals.identifier);
    setDirty(false);
  }, [selectedNode]);

  const handleSave = (): void => {
    if (selectedNode.type === 'server') {
      updateRs.mutate(
        {id: resourceServer.id, data: {name, description: description || null, identifier: identifier || null}},
        {
          onSuccess: () => {
            showToast(t('apis:detail.saved', 'Changes saved.'), 'success');
            setDirty(false);
            onRefresh();
          },
          onError: (err: Error) => {
            logger.error('Failed to update resource server', {error: err});
            showToast(t('apis:detail.saveError', 'Failed to save.'), 'error');
          },
        },
      );
    } else if (selectedNode.type === 'resource') {
      updateResource.mutate(
        {resourceId: selectedNode.id, data: {name, description: description || null}},
        {
          onSuccess: () => {
            showToast(t('apis:detail.saved', 'Changes saved.'), 'success');
            setDirty(false);
            onRefresh();
          },
          onError: (err: Error) => {
            logger.error('Failed to update resource', {error: err});
            showToast(t('apis:detail.saveError', 'Failed to save.'), 'error');
          },
        },
      );
    } else {
      const updater = selectedNode.type === 'resource-action' ? updateResourceAction : updateServerAction;
      updater.mutate(
        {actionId: selectedNode.id, data: {name, description: description || null}},
        {
          onSuccess: () => {
            showToast(t('apis:detail.saved', 'Changes saved.'), 'success');
            setDirty(false);
            onRefresh();
          },
          onError: (err: Error) => {
            logger.error('Failed to update action', {error: err});
            showToast(t('apis:detail.saveError', 'Failed to save.'), 'error');
          },
        },
      );
    }
  };

  const isReadOnly = selectedNode.type === 'server' && selectedNode.data.isReadOnly;
  const isPending =
    updateRs.isPending ||
    updateResource.isPending ||
    updateServerAction.isPending ||
    updateResourceAction.isPending;

  const permission =
    selectedNode.type === 'server' ? selectedNode.data.handle : selectedNode.data.permission;

  const nodeTypeLabel: Record<SelectedNode['type'], string> = {
    server: t('apis:detail.types.api', 'API'),
    resource: t('apis:detail.types.resource', 'Resource'),
    'server-action': t('apis:detail.types.action', 'Action'),
    'resource-action': t('apis:detail.types.action', 'Action'),
  };

  const handleField = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, p: 2, height: '100%', overflowY: 'auto'}}>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{textTransform: 'uppercase', letterSpacing: 0.5}}>
          {nodeTypeLabel[selectedNode.type]}
        </Typography>
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 0.5}}>
          <Typography variant="body2" color="text.secondary">
            {t('apis:detail.permission', 'Permission')}
          </Typography>
          <Chip
            label={permission}
            size="small"
            variant="outlined"
            sx={{fontFamily: 'monospace', fontSize: '0.78rem'}}
          />
        </Box>
      </Box>

      <Divider />

      {isReadOnly && (
        <Alert severity="info" sx={{mb: 1}}>
          {t('apis:detail.readOnlyWarning', 'This is a system API and cannot be modified.')}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label={t('apis:detail.fields.name', 'Name')}
          value={name}
          onChange={handleField(setName)}
          fullWidth
          size="small"
          disabled={isReadOnly}
        />
        <TextField
          label={t('apis:detail.fields.description', 'Description')}
          value={description}
          onChange={handleField(setDescription)}
          fullWidth
          size="small"
          multiline
          rows={3}
          disabled={isReadOnly}
        />

        {selectedNode.type === 'server' && (
          <TextField
            label={t('apis:detail.fields.identifier', 'Identifier')}
            value={identifier}
            onChange={handleField(setIdentifier)}
            fullWidth
            size="small"
            helperText={t('apis:detail.fields.identifierHint', 'Used as audience parameter in OAuth2 flows.')}
            disabled={isReadOnly}
          />
        )}

        {selectedNode.type === 'server' && (
          <Stack direction="row" spacing={2}>
            <Box sx={{flex: 1}}>
              <Typography variant="caption" color="text.secondary">
                {t('apis:detail.fields.handle', 'Handle (immutable)')}
              </Typography>
              <Box>
                <Chip label={selectedNode.data.handle} size="small" sx={{fontFamily: 'monospace', fontSize: '0.75rem', mt: 0.5}} />
              </Box>
            </Box>
            <Box sx={{flex: 1}}>
              <Typography variant="caption" color="text.secondary">
                {t('apis:detail.fields.delimiter', 'Delimiter (immutable)')}
              </Typography>
              <Box>
                <Chip label={selectedNode.data.delimiter} size="small" sx={{fontFamily: 'monospace', fontSize: '0.75rem', mt: 0.5}} />
              </Box>
            </Box>
          </Stack>
        )}

        {(selectedNode.type === 'resource' ||
          selectedNode.type === 'server-action' ||
          selectedNode.type === 'resource-action') && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              {t('apis:detail.fields.handle', 'Handle (immutable)')}
            </Typography>
            <Box>
              <Chip
                label={selectedNode.data.handle}
                size="small"
                sx={{fontFamily: 'monospace', fontSize: '0.75rem', mt: 0.5}}
              />
            </Box>
          </Box>
        )}
      </Stack>

      {!isReadOnly && dirty && (
        <Box sx={{mt: 'auto', pt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end'}}>
          <Button variant="outlined" size="small" onClick={resetForm} disabled={isPending}>
            {t('common:discard', 'Discard')}
          </Button>
          <Button variant="contained" size="small" onClick={handleSave} disabled={isPending}>
            {isPending ? t('common:saving', 'Saving…') : t('common:save', 'Save')}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function ResourceDetailPanel({
  selectedNode,
  resourceServer,
  onRefresh,
}: ResourceDetailPanelProps): JSX.Element {
  const {t} = useTranslation();

  if (!selectedNode) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.disabled',
        }}
      >
        <Typography variant="body2">
          {t('apis:detail.selectNode', 'Select a node from the tree to view its details.')}
        </Typography>
      </Box>
    );
  }

  return (
    <DetailForm
      key={selectedNode.id}
      selectedNode={selectedNode}
      resourceServer={resourceServer}
      onRefresh={onRefresh}
    />
  );
}
