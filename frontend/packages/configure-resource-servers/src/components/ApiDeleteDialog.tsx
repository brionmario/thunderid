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
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@wso2/oxygen-ui';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';
import useDeleteResourceServer from '@/api/useDeleteResourceServer';
import type {ResourceServer} from '@/models/resource-server';

export interface ApiDeleteDialogProps {
  open: boolean;
  api: ResourceServer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApiDeleteDialog({open, api, onClose, onSuccess}: ApiDeleteDialogProps): JSX.Element {
  const {t} = useTranslation();
  const {showToast} = useToast();
  const logger = useLogger('ApiDeleteDialog');
  const deleteApi = useDeleteResourceServer();

  const handleDelete = (): void => {
    if (!api) return;

    deleteApi.mutate(api.id, {
      onSuccess: () => {
        showToast(t('apis:delete.success', 'API deleted successfully.'), 'success');
        onSuccess();
      },
      onError: (err: Error) => {
        logger.error('Failed to delete API', {error: err});
        showToast(
          t('apis:delete.error', 'Failed to delete API. Make sure it has no resources or actions.'),
          'error',
        );
      },
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('apis:delete.title', 'Delete API')}</DialogTitle>
      <DialogContent>
        <Alert severity="warning" sx={{mb: 2}}>
          {t('apis:delete.warning', 'This action cannot be undone.')}
        </Alert>
        <Typography variant="body2">
          {t('apis:delete.confirm', 'Are you sure you want to delete')}
          {' '}
          <strong>{api?.name}</strong>?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" onClick={onClose} disabled={deleteApi.isPending}>
          {t('common:cancel', 'Cancel')}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={deleteApi.isPending}
        >
          {deleteApi.isPending ? t('common:deleting', 'Deleting…') : t('common:delete', 'Delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
