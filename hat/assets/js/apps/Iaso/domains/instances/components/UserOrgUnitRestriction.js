import { useSafeIntl } from 'bluesquare-components';
import React, { useState } from 'react';
import { Alert } from '@material-ui/lab';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { Snackbar } from '@material-ui/core';
import MESSAGES from '../messages';

export const UserOrgUnitRestriction = () => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const [isOpen, setIsOpen] = useState(true);

    if (currentUser.org_units.length === 0) {
        return null;
    }
    return (
        <Snackbar open={isOpen}>
            <Alert onClose={() => setIsOpen(false)} severity="info">
                {formatMessage(MESSAGES.restricted_submissions_by_orgunits)}{' '}
                {currentUser.org_units.map(ou => ou.name).join(', ')}
            </Alert>
        </Snackbar>
    );
};
