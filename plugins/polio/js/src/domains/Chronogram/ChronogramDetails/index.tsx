import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';

import { LoadingSpinner, useGoBack, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';

import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';

import MESSAGES from './messages';
import { Chronogram } from '../Chronogram/types';
import { ChronogramDetailsTable } from './Table/ChronogramDetailsTable';
import { ChronogramTaskMetaData } from '../types';
import { ChronogramTasksParams } from './types';
import { CreateChronogramTaskModal } from './Modals/ChronogramTaskCreateEditModal';
import { useGetChronogram } from './api/useGetChronogram';
import { useOptionChronogramTask } from '../api/useOptionChronogramTask';

export const ChronogramDetails: FunctionComponent = () => {
    const params = useParamsObject(
        baseUrls.chronogramDetails,
    ) as unknown as ChronogramTasksParams;

    const { data, isFetching } = useGetChronogram(params.chronogram_id);
    const { data: chronogramTaskMetaData, isFetching: isFetchingMetaData } =
        useOptionChronogramTask();

    const paramsNew: ChronogramTasksParams = {
        ...params,
        pageSize: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const goBack = useGoBack(baseUrls.chronogram);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.chronogramDetailsTitle, {
                    campaignName: data?.campaign_obr_name,
                    round_number: data?.round_number,
                    round_start_date: data?.round_start_date,
                })}
                displayBackButton={true}
                goBack={() => goBack()}
            />
            {isFetching && isFetchingMetaData && <LoadingSpinner />}
            {!isFetching && !isFetchingMetaData && (
                <Box className={classes.containerFullHeightNoTabPadded}>
                    <Grid container justifyContent="flex-end">
                        <Box>
                            <CreateChronogramTaskModal
                                iconProps={{
                                    message: MESSAGES.modalAddTitle,
                                }}
                                chronogram={data as Chronogram}
                                chronogramTaskMetaData={
                                    chronogramTaskMetaData as ChronogramTaskMetaData
                                }
                            />
                        </Box>
                    </Grid>
                    <ChronogramDetailsTable
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
