import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { EmailNotificationsTable } from './Table/EmailNotificationsTable';

const EmailNotificationConfig = ({ params }) => {
    return (
        <div>
            <TopBar title="Configuration" displayBackButton={false} />
            <EmailNotificationsTable params={params} />
        </div>
    );
};

EmailNotificationConfig.propTypes = {
    params: PropTypes.object.isRequired,
};

const emailConfigWithRouter = withRouter(EmailNotificationConfig);

export { emailConfigWithRouter as EmailNotificationConfig };
