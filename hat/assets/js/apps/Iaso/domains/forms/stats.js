import React from 'react';
import { Box, Grid } from '@mui/material';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@mui/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { InstancesPerFormGraph } from '../../components/instancesGraph';
import MESSAGES from './messages';
import { InstancesTotalGraph } from '../../components/instancesTotalGraph';

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

    return (
        <>
            <TopBar title={formatMessage(MESSAGES.statsTitle)} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container>
                    <Grid xs={6} item className={classes.card}>
                        <InstancesTotalGraph />
                    </Grid>
                    <Grid xs={6} item className={classes.card}>
                        <InstancesPerFormGraph />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
export default FormsStats;
