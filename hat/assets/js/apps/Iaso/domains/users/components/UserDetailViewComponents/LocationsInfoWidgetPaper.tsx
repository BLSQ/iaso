import React from 'react';
import { Alert, List, ListItem } from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import WidgetPaper from 'Iaso/components/papers/WidgetPaperComponent';
import { LinkToOrgUnit } from 'Iaso/domains/orgUnits/components/LinkToOrgUnit';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import MESSAGES from 'Iaso/domains/users/messages';
import { ProfileRetrieveResponseItem } from 'Iaso/domains/users/types';

type Props = {
    savingProfile?: boolean;
    profile?: ProfileRetrieveResponseItem;
};

export const LocationsInfoWidgetPaper = ({ savingProfile, profile }: Props) => {
    const { formatMessage } = useSafeIntl();

    return (
        <WidgetPaper
            title={formatMessage(MESSAGES.locations)}
            data-testid={'locations-info-box'}
        >
            {savingProfile && <LoadingSpinner absolute fixed={false} />}

            {profile?.org_units?.length && (
                <List>
                    {profile?.org_units?.map((orgUnit: OrgUnit) => (
                        <ListItem key={`orgUnit-${orgUnit.id}`}>
                            <LinkToOrgUnit orgUnit={orgUnit} />
                        </ListItem>
                    ))}
                </List>
            )}
            {!profile?.org_units?.length && (
                <Alert color={'info'} severity={'info'} sx={{ mx: 2, mb: 2 }}>
                    {formatMessage(MESSAGES.noResultsFound)}
                </Alert>
            )}
        </WidgetPaper>
    );
};
