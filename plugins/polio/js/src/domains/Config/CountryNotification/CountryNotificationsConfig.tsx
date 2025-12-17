import React from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { commonStyles } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { useParamsObject } from '../../../../../../../hat/assets/js/apps/Iaso/routing/hooks/useParamsObject';
import { CountryNotificationsConfigTable } from './Table/CountryNotificationsConfigTable';
import { baseUrls } from '../../../constants/urls';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
export const CountryNotificationsConfig = () => {
    const classes = useStyles();
    const params = useParamsObject(baseUrls.countryConfig);
    return (
        <div>
            <TopBar title="Configuration" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <CountryNotificationsConfigTable params={params} />
            </Box>
        </div>
    );
};
