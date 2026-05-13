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

import {generateRandomHumanReadableIdentifiers} from '@thunderid/utils';
import {Box, Chip, FormControl, FormLabel, Stack, TextField, Typography, useTheme} from '@wso2/oxygen-ui';
import {Lightbulb} from '@wso2/oxygen-ui-icons-react';
import {useEffect, useMemo, type ChangeEvent, type JSX} from 'react';
import {useTranslation} from 'react-i18next';

interface ConfigureDetailsProps {
  name: string;
  handle: string;
  onNameChange: (name: string) => void;
  onHandleChange: (handle: string) => void;
  onReadyChange?: (isReady: boolean) => void;
}

function deriveHandle(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ConfigureDetails({
  name,
  handle,
  onNameChange,
  onHandleChange,
  onReadyChange = undefined,
}: ConfigureDetailsProps): JSX.Element {
  const {t} = useTranslation();
  const theme = useTheme();

  const suggestions: string[] = useMemo((): string[] => generateRandomHumanReadableIdentifiers(), []);

  useEffect((): void => {
    if (onReadyChange) {
      onReadyChange(name.trim().length > 0 && handle.trim().length > 0);
    }
  }, [name, handle, onReadyChange]);

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const newName = e.target.value;
    onNameChange(newName);
    onHandleChange(deriveHandle(newName));
  };

  const handleSuggestionClick = (suggestion: string): void => {
    onNameChange(suggestion);
    onHandleChange(deriveHandle(suggestion));
  };

  const handleHandleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onHandleChange(e.target.value.toLowerCase().replace(/[^a-z0-9._\-:/]/g, ''));
  };

  return (
    <Stack direction="column" spacing={4}>
      <Typography variant="h1" gutterBottom>
        {t('apis:create.details.title', "Let's give a name to your API")}
      </Typography>

      <FormControl fullWidth required>
        <FormLabel htmlFor="api-name-input">
          {t('apis:create.details.nameLabel', 'API Name')}
        </FormLabel>
        <TextField
          id="api-name-input"
          fullWidth
          value={name}
          onChange={handleNameChange}
          placeholder={t('apis:create.details.namePlaceholder', 'e.g. Payments API')}
        />
      </FormControl>

      <Stack direction="column" spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Lightbulb size={20} color={theme.vars?.palette.warning.main} />
          <Typography variant="body2" color="text.secondary">
            {t('apis:create.details.suggestions', 'Need inspiration? Pick one:')}
          </Typography>
        </Stack>
        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
          {suggestions.map((suggestion: string): JSX.Element => (
            <Chip
              key={suggestion}
              label={suggestion}
              onClick={(): void => handleSuggestionClick(suggestion)}
              variant="outlined"
              clickable
              sx={{
                '&:hover': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  borderColor: 'primary.main',
                },
              }}
            />
          ))}
        </Box>
      </Stack>

      <FormControl fullWidth required>
        <FormLabel htmlFor="api-handle-input">
          {t('apis:create.details.handleLabel', 'API Handle')}
        </FormLabel>
        <TextField
          id="api-handle-input"
          fullWidth
          value={handle}
          onChange={handleHandleChange}
          placeholder={t('apis:create.details.handlePlaceholder', 'e.g. payments-api')}
          helperText={t(
            'apis:create.details.handleHint',
            'The handle prefixes every permission in this API — for example, handle "payments-api" produces permissions like payments-api:invoices:read. It cannot be changed after creation.',
          )}
        />
      </FormControl>
    </Stack>
  );
}
