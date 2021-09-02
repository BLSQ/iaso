import React from 'react';
import { Box, Grid } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core/styles';
import TopBar from '../../components/nav/TopBarComponent';
import { InstancesPerFormGraph } from '../../components/instancesGraph';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    card: {
        border: 'gray solid',
        height: '500px',
        borderRadius: 5,
        padding: 10,
    },
}));

const FormsStats = () => {
    const classes = useStyles();

    return (
        <>
            <TopBar title="Form Stats" />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <Grid container>
                    <Grid xs={6} item className={classes.card}>
                        <InstancesPerFormGraph />
                    </Grid>
                </Grid>
            </Box>
        </>
    );
};
export default FormsStats;
