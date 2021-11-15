import React from 'react';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { CountryNotificationsConfigTable } from './Table/CountryNotificationsConfigTable';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
export const CountryNotificationsConfig = () => {
    const classes = useStyles();
    return (
        <div>
            <TopBar title="Configuration" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <CountryNotificationsConfigTable />
            </Box>
        </div>
    );
};
