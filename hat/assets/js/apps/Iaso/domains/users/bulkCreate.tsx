import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import TopBar from 'Iaso/components/nav/TopBarComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { BulkImportForm } from 'Iaso/domains/users/components/BulkImport/BulkImportForm';
import MESSAGES from 'Iaso/domains/users/messages';

export const UsersBulkCreate = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <TopBar
                title={`${formatMessage(MESSAGES.users)} | ${formatMessage(MESSAGES.createFromFile)}`}
            />
            <BulkImportForm cancelUrl={`/dashboard/${baseUrls.users}`} />
        </>
    );
};
