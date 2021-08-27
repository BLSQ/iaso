import React from 'react';
import TopBar from '../../../../../../hat/assets/js/apps/Iaso/components/nav/TopBarComponent';
import { EmailNotificationsTable } from './Table/EmailNotificationsTable';

export const EmailNotificationConfig = () => {
    return (
        <div>
            <TopBar title="Configuration" displayBackButton={false} />
            <EmailNotificationsTable />
        </div>
    );
};
