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

import {useDataGridLocaleText} from '@thunderid/hooks';
import {useLogger} from '@thunderid/logger/react';
import {Alert, Box, Chip, CircularProgress, DataGrid, IconButton, ListingTable, Tooltip, Typography} from '@wso2/oxygen-ui';
import {Pencil, Shield, Trash2} from '@wso2/oxygen-ui-icons-react';
import {useMemo, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router';
import ApiDeleteDialog from './ApiDeleteDialog';
import useGetResourceServers from '@/api/useGetResourceServers';
import type {ResourceServer} from '@/models/resource-server';

export default function ApisList(): JSX.Element {
  const navigate = useNavigate();
  const {t} = useTranslation();
  const logger = useLogger('ApisList');
  const dataGridLocaleText = useDataGridLocaleText();

  const [paginationModel, setPaginationModel] = useState<DataGrid.GridPaginationModel>({pageSize: 10, page: 0});
  const [deleteTarget, setDeleteTarget] = useState<ResourceServer | null>(null);

  const {data, isLoading, error} = useGetResourceServers({
    limit: paginationModel.pageSize,
    offset: paginationModel.page * paginationModel.pageSize,
  });

  const columns: DataGrid.GridColDef<ResourceServer>[] = useMemo(
    () => [
      {
        field: 'name',
        headerName: t('apis:listing.columns.name', 'Name'),
        flex: 1,
        minWidth: 200,
        renderCell: (params: DataGrid.GridRenderCellParams<ResourceServer>) => (
          <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Shield size={16} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={500}>
                {params.row.name}
              </Typography>
              {params.row.isReadOnly && (
                <Chip
                  label={t('apis:listing.systemApi', 'System API')}
                  size="small"
                  sx={{mt: 0.25, height: 18, fontSize: '0.65rem'}}
                />
              )}
            </Box>
          </Box>
        ),
      },
      {
        field: 'identifier',
        headerName: t('apis:listing.columns.identifier', 'Identifier'),
        flex: 1.5,
        minWidth: 240,
        renderCell: (params: DataGrid.GridRenderCellParams<ResourceServer>) =>
          params.row.identifier ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{fontFamily: 'monospace', fontSize: '0.8rem'}}
            >
              {params.row.identifier}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          ),
      },
      {
        field: 'handle',
        headerName: t('apis:listing.columns.handle', 'Handle'),
        width: 160,
        renderCell: (params: DataGrid.GridRenderCellParams<ResourceServer>) => (
          <Chip
            label={params.row.handle}
            size="small"
            variant="outlined"
            sx={{fontFamily: 'monospace', fontSize: '0.75rem'}}
          />
        ),
      },
      {
        field: 'actions',
        headerName: '',
        width: 100,
        sortable: false,
        renderCell: (params: DataGrid.GridRenderCellParams<ResourceServer>): JSX.Element => (
          <ListingTable.RowActions>
            <Tooltip title={t('apis:listing.actions.view', 'View')}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  (async (): Promise<void> => {
                    await navigate(`/apis/${params.row.id}`);
                  })().catch((err: unknown) => {
                    logger.error('Failed to navigate to API detail', {error: err});
                  });
                }}
              >
                <Pencil size={15} />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('apis:listing.actions.delete', 'Delete')}>
              <span>
                <IconButton
                  size="small"
                  disabled={params.row.isReadOnly}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(params.row);
                  }}
                >
                  <Trash2 size={15} />
                </IconButton>
              </span>
            </Tooltip>
          </ListingTable.RowActions>
        ),
      },
    ],
    [t, navigate, logger],
  );

  if (error) {
    return (
      <Alert severity="error" sx={{mt: 2}}>
        {t('apis:listing.error', 'Failed to load APIs.')}
      </Alert>
    );
  }

  if (isLoading && !data) {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <ListingTable.Provider variant="data-grid-card" loading={isLoading}>
        <ListingTable.Container disablePaper>
          <ListingTable.DataGrid
            rows={data?.resourceServers ?? []}
            columns={columns}
            getRowId={(row) => (row as ResourceServer).id}
            onRowClick={(params) => {
              (async (): Promise<void> => {
                await navigate(`/apis/${(params.row as ResourceServer).id}`);
              })().catch((err: unknown) => {
                logger.error('Failed to navigate to API detail', {error: err});
              });
            }}
            rowCount={data?.totalResults ?? 0}
            paginationMode="server"
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[5, 10, 25]}
            disableRowSelectionOnClick
            localeText={dataGridLocaleText}
            autoHeight
            sx={{'& .MuiDataGrid-row': {cursor: 'pointer'}}}
          />
        </ListingTable.Container>
      </ListingTable.Provider>

      <ApiDeleteDialog
        open={deleteTarget !== null}
        api={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => setDeleteTarget(null)}
      />
    </>
  );
}
