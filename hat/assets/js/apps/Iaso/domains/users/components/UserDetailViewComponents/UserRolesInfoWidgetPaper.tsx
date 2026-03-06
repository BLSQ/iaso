import MESSAGES from 'Iaso/domains/users/messages';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { Alert, Chip, List, ListItem } from '@mui/material';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import React from 'react';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
}
export const UserRolesInfoWidgetPaper = ({
                                             savingProfile,
                                             profile,
                                         }: Props) => {
    const { formatMessage } = useSafeIntl();

    return <WidgetPaper title={formatMessage(MESSAGES.userRoles)} data-testid={'user-roles-info-box'}>
        {savingProfile ? <LoadingSpinner absolute={false} fixed={false} /> : (
            profile?.user_roles_permissions?.length ? (
                <List>
                    {profile?.user_roles_permissions?.map(
                        userRole => {
                            return (
                                <ListItem
                                    key={`user-role-${userRole.id}`}
                                >
                                    <Chip
                                        color={'primary'}
                                        label={
                                            userRole.name
                                        }
                                    />
                                </ListItem>
                            );
                        },
                    )}
                </List>
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