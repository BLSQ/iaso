import { useSafeIntl } from 'bluesquare-components';
import React from 'react';
import { Alert } from '@material-ui/lab';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';

export const UserOrgUnitRestriction = () => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();

    if (currentUser.org_units.length === 0) {
        return null;
    }
    return (
        <Alert severity="info">
            {formatMessage(MESSAGES.restricted_submissions_by_orgunits)}{' '}
            {currentUser.org_units.map(ou => ou.name).join(', ')}
        </Alert>
    );
};
