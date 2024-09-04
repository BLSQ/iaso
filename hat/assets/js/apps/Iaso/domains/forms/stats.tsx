import React, { FunctionComponent } from 'react';
import { Box, Grid } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { InstancesPerFormGraph } from '../../components/instancesGraph';
import MESSAGES from './messages';
import { InstancesTotalGraph } from '../../components/instancesTotalGraph';
import { Filters } from './components/formStasts/Filters';
import { baseUrls } from '../../constants/urls';
import { useParamsObject } from '../../routing/hooks/useParamsObject';
import {
    useGetPerFormStats,
    useGetFormStatsSum,
} from './hooks/UseGetFormStats';
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
                    <Grid container item xs={12}>
                        <Grid xs={12} item>
                            <Filters params={params} baseUrl={baseUrl} />
                        </Grid>
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
