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
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@wso2/oxygen-ui';
import {type JSX, useState} from 'react';
import {useTranslation} from 'react-i18next';
import useCreateAction from '@/api/useCreateAction';
import useCreateResource from '@/api/useCreateResource';

export type AddNodeMode = 'resource' | 'sub-resource' | 'server-action' | 'resource-action';

export interface AddNodeDialogProps {
  open: boolean;
  mode: AddNodeMode;
  resourceServerId: string;
  parentResourceId?: string;
  parentPermission: string;
  delimiter: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddNodeDialog({
  open,
  mode,
  resourceServerId,
  parentResourceId = undefined,
  parentPermission,
  delimiter,
  onClose,
  onSuccess,
}: AddNodeDialogProps): JSX.Element {
  const {t} = useTranslation();
  const {showToast} = useToast();
  const logger = useLogger('AddNodeDialog');

  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [description, setDescription] = useState('');

  const isAction = mode === 'server-action' || mode === 'resource-action';
  const resourceId = mode === 'resource-action' ? parentResourceId : undefined;

  const createResource = useCreateResource(resourceServerId);
  const createAction = useCreateAction(resourceServerId, resourceId);

  const derivedPermission = handle.trim()
    ? `${parentPermission}${delimiter}${handle.trim()}`
    : `${parentPermission}${delimiter}…`;

  const handleClose = (): void => {
    setName('');
    setHandle('');
    setDescription('');
    onClose();
  };

  const handleSubmit = (): void => {
    const trimmedName = name.trim();
    const trimmedHandle = handle.trim();
    if (!trimmedName || !trimmedHandle) return;

    const data = {name: trimmedName, handle: trimmedHandle, description: description.trim() || undefined};

    if (isAction) {
      createAction.mutate(data, {
        onSuccess: () => {
          showToast(t('apis:tree.addAction.success', 'Action added.'), 'success');
          handleClose();
          onSuccess();
        },
        onError: (err: Error) => {
          logger.error('Failed to create action', {error: err});
          showToast(t('apis:tree.addAction.error', 'Failed to add action.'), 'error');
        },
      });
    } else {
      createResource.mutate(
        {
          ...data,
          parent: mode === 'sub-resource' ? parentResourceId : undefined,
        },
        {
          onSuccess: () => {
            showToast(t('apis:tree.addResource.success', 'Resource added.'), 'success');
            handleClose();
            onSuccess();
          },
          onError: (err: Error) => {
            logger.error('Failed to create resource', {error: err});
            showToast(t('apis:tree.addResource.error', 'Failed to add resource.'), 'error');
          },
        },
      );
    }
  };

  const titleMap: Record<AddNodeMode, string> = {
    resource: t('apis:tree.addResource.title', 'Add Resource'),
    'sub-resource': t('apis:tree.addSubResource.title', 'Add Sub-resource'),
    'server-action': t('apis:tree.addAction.title', 'Add Action'),
    'resource-action': t('apis:tree.addAction.title', 'Add Action'),
  };

  const isPending = createResource.isPending || createAction.isPending;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{titleMap[mode]}</DialogTitle>
      <DialogContent>
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, pt: 1}}>
          <TextField
            label={t('apis:tree.fields.name', 'Name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            size="small"
            required
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <TextField
            label={t('apis:tree.fields.handle', 'Handle')}
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9._\-:/]/g, ''))}
            fullWidth
            size="small"
            required
            helperText={t('apis:tree.fields.handleHint', 'Lowercase, alphanumeric and . _ - : / — cannot be changed after creation.')}
          />
          <TextField
            label={t('apis:tree.fields.description', 'Description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
          />

          {handle.trim() && (
            <Box sx={{bgcolor: 'action.hover', borderRadius: 1, px: 1.5, py: 1}}>
              <Typography variant="caption" color="text.secondary">
                {t('apis:tree.fields.permissionPreview', 'Permission string')}
              </Typography>
              <Box sx={{mt: 0.5}}>
                <Chip
                  label={derivedPermission}
                  size="small"
                  variant="outlined"
                  sx={{fontFamily: 'monospace', fontSize: '0.8rem'}}
                />
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={handleClose} disabled={isPending}>
          {t('common:cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={isPending || !name.trim() || !handle.trim()}
        >
          {isPending ? t('common:adding', 'Adding…') : t('common:add', 'Add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
