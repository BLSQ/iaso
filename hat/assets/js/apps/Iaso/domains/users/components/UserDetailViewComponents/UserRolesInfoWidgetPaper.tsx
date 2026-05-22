import React from 'react';
import { Alert, Box, Chip } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from 'Iaso/domains/users/messages';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
};
export const UserRolesInfoWidgetPaper = ({ savingProfile, profile }: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.userRoles)}
            data-testid={'user-roles-info-box'}
        >
            {savingProfile && <LoadingSpinner absolute fixed={false} />}
            {!!profile?.user_roles_permissions?.length && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 1,
                        px: 2,
                        pb: 2,
                    }}
                >
                    {profile?.user_roles_permissions?.map(userRole => {
                        return (
                            <Box key={userRole.id}>
                                <Chip
                                    color={'secondary'}
                                    label={userRole.name}
                                />
                            </Box>
                        );
                    })}
                </Box>
            )}
            {!profile?.user_roles_permissions?.length && (
                <Alert color={'info'} severity={'info'} sx={{ mx: 2, mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
