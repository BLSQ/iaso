import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';

import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { useStyles } from '../../../styles/theme';

import { baseUrls } from '../../../constants/urls';

import MESSAGES from './messages';
import { ChronogramTaskMetaData } from '../types';
import { ChronogramTemplateTaskParams } from './types';
import { ChronogramTemplateTaskTable } from './Table/ChronogramTemplateTaskTable';
import { CreateChronogramTemplateTaskModal } from './Modals/ChronogramTemplateTaskCreateEditModal';
import { useOptionChronogramTask } from '../api/useOptionChronogramTask';

export const ChronogramTemplateTask: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.chronogramTemplateTask,
    ) as ChronogramTemplateTaskParams;

    const paramsNew: ChronogramTemplateTaskParams = {
        ...params,
        pageSize: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };

    const { data: chronogramTaskMetaData, isFetching: isFetchingMetaData } =
        useOptionChronogramTask();

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(baseUrls.chronogram);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.chronogramTemplateTaskTitle)}
                displayBackButton={true}
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
