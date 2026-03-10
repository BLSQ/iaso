import React from 'react';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { Alert } from '@mui/material';
import { PermissionTable } from '../PermissionTable';
import MESSAGES from 'Iaso/domains/users/messages';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
}

export const PermissionsInfoWidgetPaper = ({
                                               savingProfile,
                                               profile,
                                           }: Props) => {
    const { formatMessage } = useSafeIntl();
    return <WidgetPaper
        title={formatMessage(MESSAGES.permissions)}
        expandable={true}
        data-testid={'permissions-info-box'}
    >
        {savingProfile ? <LoadingSpinner absolute={false} fixed={false} /> : (
            profile?.permissions?.length ? (
                <PermissionTable
                    data={profile?.permissions}
                />
            ) : (
                <Alert
                    color={'info'}
                    severity={'info'}
                    sx={{ mx: 2, mb: 2 }}
                >
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            ))}
    </WidgetPaper>;
};