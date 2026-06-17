import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { InstancesPerFormGraph } from '../../components/instancesGraph';
import { InstancesTotalGraph } from '../../components/instancesTotalGraph';
import TopBar from '../../components/nav/TopBarComponent';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import { Filters } from './components/formStasts/Filters';
import {
    useGetPerFormStats,
    useGetFormStatsSum,
} from './hooks/UseGetFormStats';
import MESSAGES from './messages';
import { FormStatsParams } from './types/formStats';

const baseUrl = baseUrls.formsStats;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    card: {
        height: '500px',
        padding: 10,
    },
}));

export const FormsStats: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const params: FormStatsParams = useParamsObject(baseUrl);
    const { data: dataStats, isLoading: isLoadingDataStats } =
        useGetPerFormStats(params);

    const { data: dataStatsSum, isLoading: isLoadingDataStatsSum } =
        useGetFormStatsSum(params);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.statsTitle)}
                displayBackButton={false}
            />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={3}>
                    <Grid container size={12}>
                        <Grid size={12}>
                            <Filters params={params} baseUrl={baseUrl} />
                        </Grid>
                    </Grid>
                    <Grid container spacing={2} size={12}>
                        <Grid className={classes.card} size={6}>
                            <InstancesTotalGraph
                                data={dataStatsSum}
                                isLoading={isLoadingDataStatsSum}
                            />
                        </Grid>
                        <Grid className={classes.card} size={6}>
                            <InstancesPerFormGraph
                                data={dataStats}
                                isLoading={isLoadingDataStats}
                            />
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
