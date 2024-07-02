import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';

import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';

import MESSAGES from './messages';
import { ChronogramFilters } from './Filters/ChronogramFilters';
import { ChronogramParams, ChronogramTaskMetaData } from './types';
import { ChronogramTable } from './Table/ChronogramTable';
import { useOptionChronogramTask } from './api/useOptionChronogramTask';
import { useStyles } from '../../styles/theme';

export const Chronogram: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.chronogram) as ChronogramParams;

    const paramsNew: ChronogramParams = {
        ...params,
        pageSize: params.pageSize || '20',
        order: params.order || 'id',
        page: params.page || '1',
    };

    const { data: chronogramTaskMetaData, isFetching: isFetchingMetaData } =
        useOptionChronogramTask();

    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();

    return (
        <>
            {isFetchingMetaData && <LoadingSpinner />}
            {!isFetchingMetaData && (
                <>
                    <TopBar
                        title={formatMessage(MESSAGES.chronogramTitle)}
                        displayBackButton={false}
                    />
                    <Box className={classes.containerFullHeightNoTabPadded}>
                        <ChronogramFilters params={paramsNew} />
                        <ChronogramTable
                            params={paramsNew}
                            chronogramTaskMetaData={
                                chronogramTaskMetaData as ChronogramTaskMetaData
                            }
                        />
                    </Box>
                </>
            )}
        </>
    );
};
