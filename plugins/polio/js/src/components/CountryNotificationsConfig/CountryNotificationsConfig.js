import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { CountryNotificationsConfigTable } from './Table/CountryNotificationsConfigTable';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
const CountryNotificationsConfig = ({ params }) => {
    const classes = useStyles();
    return (
        <div>
            <TopBar title="Configuration" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <CountryNotificationsConfigTable params={params} />
            </Box>
        </div>
    );
};

CountryNotificationsConfig.propTypes = {
    params: PropTypes.object.isRequired,
};

const countryNotificationsConfigWithRouter = withRouter(
    CountryNotificationsConfig,
);

export { countryNotificationsConfigWithRouter as CountryNotificationsConfig };
