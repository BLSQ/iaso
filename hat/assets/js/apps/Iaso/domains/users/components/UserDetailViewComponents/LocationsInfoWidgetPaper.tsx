import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import React from 'react';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/users/messages';
import { Alert, List, ListItem } from '@mui/material';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem
}

export const LocationsInfoWidgetPaper = ({
                                             savingProfile,
                                             profile,
                                         }: Props) => {
    const { formatMessage } = useSafeIntl();

    return <WidgetPaper title={formatMessage(MESSAGES.locations)} data-testid={'locations-info-box'}>
        {savingProfile ? <LoadingSpinner absolute={false} fixed={false} /> :
            (profile?.org_units?.length ? (
                <List>
                    {profile?.org_units?.map(
                        (orgUnit: OrgUnit) => (
                            <ListItem
                                key={`orgUnit-${orgUnit.id}`}
                            >
                                {orgUnit.name}
                            </ListItem>
                        ),
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