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

import {Alert, Box, Chip, Stack, Typography} from '@wso2/oxygen-ui';
import {LayoutGrid, ShieldOff} from '@wso2/oxygen-ui-icons-react';
import type {JSX} from 'react';
import {useTranslation} from 'react-i18next';

const MOCK_APPS = [
  {id: '1', name: 'My Application', clientId: 'abc123xyz', access: 'none' as const},
  {id: '2', name: 'Admin Dashboard', clientId: 'def456uvw', access: 'none' as const},
  {id: '3', name: 'Mobile App', clientId: 'ghi789rst', access: 'none' as const},
];

export default function ApplicationAccessTab(): JSX.Element {
  const {t} = useTranslation();

  return (
    <Box>
      <Alert severity="info" sx={{mb: 3}}>
        {t(
          'apis:appAccess.comingSoon',
          'Application access management is coming soon. You will be able to authorize specific applications to access this API and configure which permissions each application can request.',
        )}
      </Alert>

      <Typography variant="subtitle2" sx={{mb: 2}}>
        {t('apis:appAccess.title', 'Applications')}
      </Typography>

      <Stack spacing={1}>
        {MOCK_APPS.map((app) => (
          <Box
            key={app.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              opacity: 0.6,
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                bgcolor: 'action.hover',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LayoutGrid size={18} />
            </Box>

            <Box sx={{flex: 1}}>
              <Typography variant="body2" fontWeight={500}>
                {app.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{fontFamily: 'monospace'}}>
                {app.clientId}
              </Typography>
            </Box>

            <Chip
              icon={<ShieldOff size={12} />}
              label={t('apis:appAccess.noAccess', 'No access')}
              size="small"
              variant="outlined"
              color="default"
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
