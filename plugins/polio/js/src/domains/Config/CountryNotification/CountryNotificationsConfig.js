import React from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
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
