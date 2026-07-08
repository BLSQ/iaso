import React, { useMemo, useState } from 'react';
import {
    Box,
    FormControlLabel,
    FormGroup,
    Grid,
    Switch,
    useTheme,
} from '@mui/material';
import { commonStyles, useGoBack, useSafeIntl } from 'bluesquare-components';
import { useApiDiffInstancesList } from 'Iaso/api/instanceDiff';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import {
    formatLogContent,
    LogContentSource,
} from '../compare/components/CompareInstanceLogs';
import { InstanceLogDetail } from '../compare/components/InstanceLogDetail';
import { FormattedInstanceLog } from '../compare/utils/formattedInstanceLog';
import { useGetInstance } from '../hooks/requests/useGetInstance';
import { ValidationPaper } from './components/ValidationPaper/ValidationPaper';
import MESSAGES from './messages';
import { InstanceValidationParams } from './types';
import {
    formatFilteredDiffContent,
    getChangedKeysFromDiff,
} from './utils/formatFilteredDiffContent';

const diffParams = {
    limit: 2,
    page: 1,
    order: '-created_at',
};

export const ValidateInstance = () => {
    const params = useParamsObject(
        baseUrls.instanceValidation,
    ) as InstanceValidationParams;
    const theme = useTheme();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack();

    const [showAllFields, setShowAllFields] = useState<boolean>(false);
    const { data: instance, isLoading: isLoadingInstance } = useGetInstance(
        params.instanceId,
        {
            cacheTime: Infinity,
            staleTime: Infinity,
        },
    );
    const {
        data: diff,
        isLoading: isLoadingDiff,
        isError,
    } = useApiDiffInstancesList(params.instanceId, diffParams);

    const isDiffContentLoading = isLoadingInstance || isLoadingDiff;
    const diffResultCount = diff?.results?.length ?? 0;
    const hasDiffContent =
        !isDiffContentLoading && Boolean(diff) && diffResultCount >= 2;
    const showDiffPlaceholder =
        !isDiffContentLoading &&
        Boolean(instance) &&
        Boolean(diff) &&
        !isError &&
        diffResultCount < 2;
    const showDiffPanel =
        Boolean(instance) &&
        (isDiffContentLoading ||
            isError ||
            hasDiffContent ||
            showDiffPlaceholder);

    const diffContent = useMemo((): FormattedInstanceLog | null => {
        const results = diff?.results;
        if (!results || results.length < 2) {
            return null;
        }

        const previousResult = results[1] as
            | Partial<LogContentSource>
            | undefined;
        const currentResult = results[0] as
            | Partial<LogContentSource>
            | undefined;

        if (showAllFields || !previousResult || !currentResult) {
            return formatLogContent(previousResult, currentResult);
        }

        const changedKeys = getChangedKeysFromDiff(results[0]?.diff);

        return formatFilteredDiffContent(
            previousResult,
            currentResult,
            changedKeys,
        );
    }, [diff, showAllFields]);

    return (
        <>
            <TopBar
                displayBackButton
                goBack={goBack}
                title={formatMessage(MESSAGES.validateInstance)}
            />
            <Box sx={commonStyles(theme).containerFullHeightNoTabPadded}>
                <Grid container spacing={2}>
                    {instance && (
                        <Grid item xs={12} sm={6}>
                            <ValidationPaper
                                formName={instance?.form_name ?? ''}
                            />
                        </Grid>
                    )}
                    {showDiffPanel && (
                        <Grid item xs={12}>
                            {isDiffContentLoading && (
                                <InstanceLogDetail
                                    instanceLogContent={null}
                                    isLogDetailLoading
                                    isLogDetailError={isError}
                                    headerA={MESSAGES.previous}
                                    headerB={MESSAGES.current}
                                />
                            )}
                            {!isDiffContentLoading && isError && (
                                <InstanceLogDetail
                                    instanceLogContent={null}
                                    isLogDetailLoading={false}
                                    isLogDetailError
                                    headerA={MESSAGES.previous}
                                    headerB={MESSAGES.current}
                                />
                            )}
                            {hasDiffContent && (
                                <>
                                    <Box
                                        sx={{
                                            marginBottom: theme =>
                                                theme.spacing(2),
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                        }}
                                    >
                                        <FormGroup>
                                            <FormControlLabel
                                                style={{
                                                    width: 'max-content',
                                                }}
                                                control={
                                                    <Switch
                                                        size="medium"
                                                        checked={showAllFields}
                                                        onChange={(
                                                            _,
                                                            checked,
                                                        ) =>
                                                            setShowAllFields(
                                                                checked,
                                                            )
                                                        }
                                                        color="primary"
                                                    />
                                                }
                                                label={formatMessage(
                                                    MESSAGES.toggleShowAllFields,
                                                )}
                                            />
                                        </FormGroup>
                                    </Box>
                                    <InstanceLogDetail
                                        instanceLogContent={diffContent}
                                        isLogDetailLoading={false}
                                        isLogDetailError={false}
                                        headerA={MESSAGES.previous}
                                        headerB={MESSAGES.current}
                                    />
                                </>
                            )}
                            {showDiffPlaceholder && (
                                <InstanceLogDetail
                                    instanceLogContent={null}
                                    isLogDetailLoading={false}
                                    isLogDetailError={false}
                                    emptyPlaceholder={
                                        MESSAGES.noPreviousVersion
                                    }
                                    headerA={MESSAGES.previous}
                                    headerB={MESSAGES.current}
                                />
                            )}
                        </Grid>
                    )}
                </Grid>
            </Box>
        </>
    );
};
