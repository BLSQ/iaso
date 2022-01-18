import { useCurrentUser } from '../../../utils/usersUtils';
import { useSafeIntl } from 'bluesquare-components';
import { Card, CardContent, Typography } from '@material-ui/core';
import React from 'react';
import MESSAGES from '../messages';

export const UserOrgUnitRestriction = () => {
    const currentUser = useCurrentUser();
    const { formatMessage } = useSafeIntl();

    if (currentUser.org_units.length === 0) {
        return null;
    }
    return (
        <Card>
            {/* Override the rule for the last child that make it seems */}
            {/* unbalanced */}
            <CardContent style={{ paddingBottom: 16 }}>
                <Typography>
                    {formatMessage(MESSAGES.restricted_submissions_by_orgunits)}{' '}
                    {currentUser.org_units.map(ou => ou.name).join(', ')}
                </Typography>
            </CardContent>
        </Card>
    );
};
