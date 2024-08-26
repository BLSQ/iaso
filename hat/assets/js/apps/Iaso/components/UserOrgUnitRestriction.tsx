import { Alert } from '@mui/lab';
import { Snackbar } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, { useState } from 'react';
import MESSAGES from '../domains/instances/messages';
import { useCurrentUser } from '../utils/usersUtils';

export const UserOrgUnitRestriction: React.FunctionComponent = () => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();
    const [isOpen, setIsOpen] = useState(true);

    if (currentUser.org_units.length === 0) {
        return null;
    }
    return (
        <Snackbar open={isOpen}>
            <Alert onClose={() => setIsOpen(false)} severity="info">
                {formatMessage(MESSAGES.restricted_results_by_orgunits)}{' '}
                {currentUser.org_units.map(ou => ou.name).join(', ')}
            </Alert>
        </Snackbar>
    );
};
