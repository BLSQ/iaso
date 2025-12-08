import React, { FunctionComponent } from 'react';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { baseUrls } from '../../../constants/urls';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { Table } from './Table';
import { Filters } from './Filters';
import { Box, Grid } from '@mui/material';
import { useStyles } from '../../../styles/theme';
import { CreatePerformanceThreshold } from './Modal/CreateEditModal';

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
                <Grid container justifyContent="flex-end">
                    <Box mt={2}>
                        <CreatePerformanceThreshold iconProps={{}} />
                    </Box>
                </Grid>

                <Table params={params} />
            </Box>
        </>
    );
};
