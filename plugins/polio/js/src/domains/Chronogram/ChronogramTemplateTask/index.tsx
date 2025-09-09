import { Box, Grid } from '@mui/material';
import React, { FunctionComponent } from 'react';

import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useStyles } from '../../../styles/theme';

import { baseUrls } from '../../../constants/urls';

import { useOptionChronogramTask } from '../api/useOptionChronogram';
import { ChronogramParams } from '../Chronogram/types';
import { defaultParams } from '../constants';
import { ChronogramTaskMetaData } from '../types';
import MESSAGES from './messages';
import { CreateChronogramTemplateTaskModal } from './Modals/ChronogramTemplateTaskCreateEditModal';
import { ChronogramTemplateTaskTable } from './Table/ChronogramTemplateTaskTable';
import { ChronogramTemplateTaskParams } from './types';

export const ChronogramTemplateTask: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.chronogramTemplateTask,
    ) as ChronogramTemplateTaskParams;

    const paramsNew: ChronogramParams = { ...defaultParams, ...params };

    const { data: chronogramTaskMetaData, isFetching: isFetchingMetaData } =
        useOptionChronogramTask();

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(baseUrls.chronogram);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.chronogramTemplateTaskTitle)}
                displayBackButton
                goBack={() => goBack()}
            />
            {isFetchingMetaData && <LoadingSpinner />}
            {!isFetchingMetaData && (
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Grid container justifyContent="flex-end">
                        <Box>
                            <CreateChronogramTemplateTaskModal
                                iconProps={{
                                    message: MESSAGES.modalAddTitle,
                                }}
                                chronogramTaskMetaData={
                                    chronogramTaskMetaData as ChronogramTaskMetaData
                                }
                            />
                        </Box>
                    </Grid>
                    <ChronogramTemplateTaskTable
                        params={paramsNew}
                        chronogramTaskMetaData={
                            chronogramTaskMetaData as ChronogramTaskMetaData
                        }
                    />
                </Box>
            )}
        </>
    );
};
