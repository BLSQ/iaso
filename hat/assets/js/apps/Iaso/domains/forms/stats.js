import React from 'react';
import { Box, Grid } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { InstancesPerFormGraph } from '../../components/instancesGraph';
import MESSAGES from './messages';
import { InstancesTotalGraph } from '../../components/instancesTotalGraph';
import { Filters } from './components/formStasts/Filters.tsx';
import { baseUrls } from '../../constants/urls.ts';
import { useParamsObject } from '../../routing/hooks/useParamsObject.tsx';
import { useGetFormStats } from './hooks/UseGetFormStats.tsx';

const baseUrl = baseUrls.formsStats;

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    card: {
        height: '500px',
        padding: 10,
    },
}));

const FormsStats = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const params = useParamsObject(baseUrl);
    const { data: dataStats, isLoading: isLoadingDataStats } = useGetFormStats(
        baseUrl,
        '/api/instances/stats/',
        ['instances', 'stats'],
    );

    const { data: dataStatsSum, isLoading: isLoadingDataStatsSum } =
        useGetFormStats(baseUrl, '/api/instances/stats_sum/', [
            'instances',
            'stats_sum',
        ]);

    return (
        <>
            <TopBar
                title={formatMessage(MESSAGES.statsTitle)}
                displayBackButton={false}
            />

            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container spacing={9}>
                    <Grid container item xs={12}>
                        <Box mx={2} width="100%">
                            <Filters params={params} baseUrl={baseUrl} />
                        </Box>
                    </Grid>
                    <Grid container item xs={12} spacing={2}>
                        <Grid xs={6} item className={classes.card}>
                            <InstancesTotalGraph
                                data={dataStatsSum}
                                isLoading={isLoadingDataStatsSum}
                            />
                        </Grid>
                        <Grid xs={6} item className={classes.card}>
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
export default FormsStats;
