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

import {useLogger} from '@thunderid/logger/react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  PageContent,
  PageTitle,
  Tab,
  Tabs,
  Typography,
} from '@wso2/oxygen-ui';
import {ArrowLeft, Shield} from '@wso2/oxygen-ui-icons-react';
import {useState, type JSX, type SyntheticEvent} from 'react';
import {useTranslation} from 'react-i18next';
import {Link, useNavigate, useParams} from 'react-router';
import useGetResourceServer from '@/api/useGetResourceServer';
import ApplicationAccessTab from '@/components/api-detail/ApplicationAccessTab';
import SettingsTab from '@/components/api-detail/SettingsTab';
import ApiDeleteDialog from '@/components/ApiDeleteDialog';
import ResourceTree from '@/components/resource-tree/ResourceTree';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({children = undefined, value, index}: TabPanelProps): JSX.Element {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{pt: 3, height: value === index ? 'auto' : 0, overflow: 'hidden'}}
    >
      {value === index && children}
    </Box>
  );
}

export default function ApiEditPage(): JSX.Element {
  const {resourceServerId} = useParams<{resourceServerId: string}>();
  const navigate = useNavigate();
  const {t} = useTranslation();
  const logger = useLogger('ApiEditPage');

  const {data: resourceServer, isLoading, error, refetch} = useGetResourceServer(resourceServerId ?? '');

  const [activeTab, setActiveTab] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleTabChange = (_e: SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const listUrl = '/apis';

  if (isLoading) {
    return (
      <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px'}}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !resourceServer) {
    return (
      <PageContent>
        <Alert severity="error" sx={{mb: 2}}>
          {error?.message ?? t('apis:edit.notFound', 'API not found.')}
        </Alert>
        <Button
          startIcon={<ArrowLeft size={16} />}
          onClick={() => {
            (async (): Promise<void> => {
              await navigate(listUrl);
            })().catch((err: unknown) => {
              logger.error('Failed to navigate back', {error: err});
            });
          }}
        >
          {t('apis:edit.back', 'Back to APIs')}
        </Button>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageTitle>
        <PageTitle.BackButton component={<Link to={listUrl} />}>
          {t('apis:edit.back', 'Back to APIs')}
        </PageTitle.BackButton>
        <PageTitle.Header>
          <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={20} />
            </Box>
            <Box>
              <Typography variant="h3">{resourceServer.name}</Typography>
              <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mt: 0.25}}>
                {resourceServer.isReadOnly && (
                  <Chip label={t('apis:edit.systemApi', 'System API')} size="small" />
                )}
                {resourceServer.identifier && (
                  <Typography variant="caption" color="text.secondary" sx={{fontFamily: 'monospace'}}>
                    {resourceServer.identifier}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </PageTitle.Header>
        <PageTitle.Actions>
          {!resourceServer.isReadOnly && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setDeleteDialogOpen(true)}
            >
              {t('common:delete', 'Delete')}
            </Button>
          )}
        </PageTitle.Actions>
      </PageTitle>

      <Tabs value={activeTab} onChange={handleTabChange} aria-label={t('apis:edit.tabs', 'API settings')}>
        <Tab label={t('apis:edit.tab.settings', 'Settings')} id="api-tab-0" aria-controls="api-tabpanel-0" sx={{textTransform: 'none'}} />
        <Tab label={t('apis:edit.tab.permissions', 'Permissions')} id="api-tab-1" aria-controls="api-tabpanel-1" sx={{textTransform: 'none'}} />
        <Tab label={t('apis:edit.tab.appAccess', 'Application Access')} id="api-tab-2" aria-controls="api-tabpanel-2" sx={{textTransform: 'none'}} />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <SettingsTab
          key={resourceServer.id}
          resourceServer={resourceServer}
          onRefresh={() => {
            void refetch();
          }}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{height: 'calc(100vh - 280px)', minHeight: 400}}>
          <ResourceTree
            resourceServer={resourceServer}
            onRefresh={() => {
              void refetch();
            }}
          />
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ApplicationAccessTab />
      </TabPanel>

      <ApiDeleteDialog
        open={deleteDialogOpen}
        api={resourceServer}
        onClose={() => setDeleteDialogOpen(false)}
        onSuccess={() => {
          (async (): Promise<void> => {
            await navigate(listUrl);
          })().catch((err: unknown) => {
            logger.error('Failed to navigate after delete', {error: err});
          });
        }}
      />
    </PageContent>
  );
}
