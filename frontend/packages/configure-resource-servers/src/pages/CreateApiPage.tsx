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

import {useHasMultipleOUs} from '@thunderid/configure-organization-units';
import {useToast} from '@thunderid/contexts';
import {useLogger} from '@thunderid/logger/react';
import {Alert, Box, Breadcrumbs, Button, CircularProgress, IconButton, LinearProgress, Stack, Typography} from '@wso2/oxygen-ui';
import {ChevronRight, X} from '@wso2/oxygen-ui-icons-react';
import {useCallback, useMemo, useState, type JSX} from 'react';
import {useTranslation} from 'react-i18next';
import {useNavigate} from 'react-router';
import ConfigureDetails from '../components/create-api/ConfigureDetails';
import ConfigureOrgUnit from '../components/create-api/ConfigureOrgUnit';
import useCreateResourceServer from '@/api/useCreateResourceServer';

const ApiCreateStep = {
  DETAILS: 'DETAILS',
  ORGANIZATION_UNIT: 'ORGANIZATION_UNIT',
} as const;

type ApiCreateStep = keyof typeof ApiCreateStep;

export default function CreateApiPage(): JSX.Element {
  const navigate = useNavigate();
  const {t} = useTranslation();
  const {showToast} = useToast();
  const logger = useLogger('CreateApiPage');
  const createApi = useCreateResourceServer();

  const {hasMultipleOUs, isLoading: isOuLoading, ouList} = useHasMultipleOUs();

  const [currentStep, setCurrentStep] = useState<ApiCreateStep>(ApiCreateStep.DETAILS);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [ouId, setOuId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [stepReady, setStepReady] = useState<Record<ApiCreateStep, boolean>>({
    DETAILS: false,
    ORGANIZATION_UNIT: false,
  });

  const steps: Record<ApiCreateStep, {label: string; order: number}> = useMemo(
    () => ({
      DETAILS: {label: t('apis:create.steps.details', 'Create an API'), order: 1},
      ORGANIZATION_UNIT: {label: t('apis:create.steps.organizationUnit', 'Organization'), order: 2},
    }),
    [t],
  );

  const effectiveOuId = hasMultipleOUs ? ouId : (ouList[0]?.id ?? '');

  const handleClose = (): void => {
    (async (): Promise<void> => {
      await navigate('/apis');
    })().catch((err: unknown) => {
      logger.error('Failed to navigate to APIs list', {error: err});
    });
  };

  const handleStepReadyChange = useCallback((step: ApiCreateStep, isReady: boolean): void => {
    setStepReady((prev) => ({...prev, [step]: isReady}));
  }, []);

  const handleDetailsReadyChange = useCallback(
    (isReady: boolean): void => handleStepReadyChange(ApiCreateStep.DETAILS, isReady),
    [handleStepReadyChange],
  );

  const handleOuReadyChange = useCallback(
    (isReady: boolean): void => handleStepReadyChange(ApiCreateStep.ORGANIZATION_UNIT, isReady),
    [handleStepReadyChange],
  );

  const isLastStep = currentStep === ApiCreateStep.ORGANIZATION_UNIT || !hasMultipleOUs;

  const handleNext = (): void => {
    setError(null);

    if (currentStep === ApiCreateStep.DETAILS && !isOuLoading && hasMultipleOUs) {
      setCurrentStep(ApiCreateStep.ORGANIZATION_UNIT);
      return;
    }

    const resolvedOuId = effectiveOuId;
    if (!resolvedOuId) return;

    createApi.mutate(
      {name: name.trim(), handle: handle.trim(), ouId: resolvedOuId},
      {
        onSuccess: (created) => {
          showToast(t('apis:create.success', 'API created successfully.'), 'success');
          (async (): Promise<void> => {
            await navigate(`/apis/${created.id}`);
          })().catch((err: unknown) => {
            logger.error('Failed to navigate after create', {error: err});
          });
        },
        onError: (err: Error) => {
          logger.error('Failed to create API', {error: err});
          setError(err.message);
        },
      },
    );
  };

  const handleBack = (): void => {
    if (currentStep === ApiCreateStep.ORGANIZATION_UNIT) {
      setCurrentStep(ApiCreateStep.DETAILS);
    }
  };

  const isNextDisabled =
    createApi.isPending ||
    !stepReady[currentStep] ||
    (currentStep === ApiCreateStep.DETAILS && isOuLoading);

  const getProgress = (): number => {
    const totalSteps = hasMultipleOUs ? 2 : 1;
    const currentOrder = steps[currentStep].order;
    return (currentOrder / totalSteps) * 100;
  };

  const getBreadcrumbSteps = (): ApiCreateStep[] => {
    const all: ApiCreateStep[] = [ApiCreateStep.DETAILS];
    if (hasMultipleOUs) all.push(ApiCreateStep.ORGANIZATION_UNIT);
    const idx = all.indexOf(currentStep);
    return all.slice(0, idx + 1);
  };

  const renderStep = (): JSX.Element | null => {
    switch (currentStep) {
      case ApiCreateStep.DETAILS:
        return (
          <ConfigureDetails
            name={name}
            handle={handle}
            onNameChange={setName}
            onHandleChange={setHandle}
            onReadyChange={handleDetailsReadyChange}
          />
        );
      case ApiCreateStep.ORGANIZATION_UNIT:
        return (
          <ConfigureOrgUnit
            selectedOuId={ouId}
            onOuIdChange={setOuId}
            onReadyChange={handleOuReadyChange}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{minHeight: '100vh', display: 'flex', flexDirection: 'column'}}>
      <LinearProgress variant="determinate" value={getProgress()} sx={{height: 6}} />

      <Box sx={{flex: 1, display: 'flex', flexDirection: 'row'}}>
        <Box sx={{flex: 1, display: 'flex', flexDirection: 'column'}}>
          {/* Header */}
          <Box sx={{p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <IconButton
                onClick={handleClose}
                sx={{bgcolor: 'background.paper', '&:hover': {bgcolor: 'action.hover'}, boxShadow: 1}}
              >
                <X size={24} />
              </IconButton>
              <Breadcrumbs separator={<ChevronRight size={16} />} aria-label="breadcrumb">
                {getBreadcrumbSteps().map((step, index, array) => {
                  const isLast = index === array.length - 1;
                  return isLast ? (
                    <Typography key={step} variant="h5" color="text.primary">
                      {steps[step].label}
                    </Typography>
                  ) : (
                    <Typography
                      key={step}
                      variant="h5"
                      onClick={() => setCurrentStep(step)}
                      sx={{cursor: 'pointer'}}
                    >
                      {steps[step].label}
                    </Typography>
                  );
                })}
              </Breadcrumbs>
            </Stack>
          </Box>

          {/* Content */}
          <Box sx={{flex: 1, display: 'flex', minHeight: 0}}>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                py: 8,
                px: 20,
                mx: 'auto',
              }}
            >
              <Box sx={{width: '100%', maxWidth: 800, display: 'flex', flexDirection: 'column'}}>
                {error && (
                  <Alert severity="error" sx={{mb: 4}} onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {renderStep()}

                {/* Navigation */}
                <Box
                  sx={{
                    mt: 4,
                    display: 'flex',
                    justifyContent: currentStep === ApiCreateStep.DETAILS ? 'flex-end' : 'space-between',
                    gap: 2,
                  }}
                >
                  {currentStep !== ApiCreateStep.DETAILS && (
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      sx={{minWidth: 100}}
                      disabled={createApi.isPending}
                    >
                      {t('common:actions.back', 'Back')}
                    </Button>
                  )}

                  <Box sx={{display: 'flex', alignItems: 'center', gap: 2}}>
                    {createApi.isPending && <CircularProgress size={20} />}
                    <Button
                      variant="contained"
                      disabled={isNextDisabled}
                      sx={{minWidth: 100}}
                      onClick={handleNext}
                    >
                      {isLastStep
                        ? createApi.isPending
                          ? t('apis:create.creating', 'Creating…')
                          : t('apis:create.submit', 'Create API')
                        : t('common:actions.continue', 'Continue')}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
