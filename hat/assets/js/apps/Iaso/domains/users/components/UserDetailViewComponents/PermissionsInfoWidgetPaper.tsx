import React from 'react';
import { Alert } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from 'Iaso/domains/users/messages';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';
import { PermissionTable } from '../PermissionTable';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
};

export const PermissionsInfoWidgetPaper = ({
    savingProfile,
    profile,
}: Props) => {
    const { formatMessage } = useSafeIntl();
    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.permissions)}
            data-testid={'permissions-info-box'}
            sx={{ position: 'relative' }}
        >
            {savingProfile && <LoadingSpinner absolute fixed={false} />}
            {!!profile?.permissions?.length && (
                <PermissionTable data={profile?.permissions} />
            )}
            {!profile?.permissions?.length && (
                <Alert color={'info'} severity={'info'} sx={{ mx: 2, mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
