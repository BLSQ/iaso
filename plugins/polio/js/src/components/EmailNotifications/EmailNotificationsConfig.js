import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import { Box, makeStyles } from '@material-ui/core';
import { commonStyles } from 'bluesquare-components';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { EmailNotificationsTable } from './Table/EmailNotificationsTable';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
}));
const EmailNotificationConfig = ({ params }) => {
    const classes = useStyles();
    return (
        <div>
            <TopBar title="Configuration" displayBackButton={false} />
            <Box className={classes.containerFullHeightNoTabPadded}>
                <EmailNotificationsTable params={params} />
            </Box>
        </div>
    );
};

EmailNotificationConfig.propTypes = {
    params: PropTypes.object.isRequired,
};

const emailConfigWithRouter = withRouter(EmailNotificationConfig);

export { emailConfigWithRouter as EmailNotificationConfig };
