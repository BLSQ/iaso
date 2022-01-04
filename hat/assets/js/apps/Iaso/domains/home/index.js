import React from 'react';
import { Grid, makeStyles, Typography } from '@material-ui/core';

import { commonStyles, useSafeIntl } from 'bluesquare-components';

import TopBar from '../../components/nav/TopBarComponent';

import { baseUrls } from '../../constants/urls';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));

const Home = () => {
    const intl = useSafeIntl();
    // const classes = useStyles();

    return (
        <>
            <TopBar title={'home'} displayBackButton={false} />
            <Grid container>
                <Typography>Home</Typography>
            </Grid>
        </>
    );
};

export default Home;
