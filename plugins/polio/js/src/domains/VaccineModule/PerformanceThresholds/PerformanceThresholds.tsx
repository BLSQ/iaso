import React, { FunctionComponent } from 'react';
import { Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { POLIO_PERFORMANCE_THRESHOLD_WRITE_PERMISSION } from '../../../constants/permissions';
import { baseUrls } from '../../../constants/urls';
import { useStyles } from '../../../styles/theme';
import { Filters } from './Filters';
import MESSAGES from './messages';
import { CreatePerformanceThreshold } from './Modal/CreateEditModal';
import { Table } from './Table';

export const PerformanceThresholds: FunctionComponent = () => {
    const params = useParamsObject(baseUrls.performanceThresholds);
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.performanceThresholds)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Filters params={params} />
                <Box mt={2} justifyContent="flex-end" display="flex">
                    <DisplayIfUserHasPerm
                        permissions={[
                            POLIO_PERFORMANCE_THRESHOLD_WRITE_PERMISSION,
                        ]}
                    >
                        <CreatePerformanceThreshold iconProps={{}} />
                    </DisplayIfUserHasPerm>
                </Box>
                <Table params={params} />
            </Box>
        </>
    );
};
