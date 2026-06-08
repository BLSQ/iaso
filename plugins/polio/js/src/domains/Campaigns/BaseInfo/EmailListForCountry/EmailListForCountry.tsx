import React, { FunctionComponent } from 'react';
import { CircularProgress, Tooltip, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { useCountryUsersGroup } from '../../../Config/CountryNotification/requests';

type Props = {
    countryId?: number;
};
export const EmailListForCountry: FunctionComponent<Props> = ({
    countryId,
}) => {
    const { formatMessage } = useSafeIntl();

    const { data: cug, isLoading: cugIsLoading } =
        useCountryUsersGroup(countryId);
    if (!countryId) return null;

    const emailList = cug?.read_only_users_field
        .map(user => user.email)
        .join(', ');

    return (
        <Tooltip title={formatMessage(MESSAGES.emailListTooltip)}>
            <Typography component="div">
                {formatMessage(MESSAGES.emailListLabel)}{' '}
                {cugIsLoading ? (
                    <span style={{ paddingLeft: 4 }}>
                        <CircularProgress size={10} />
                    </span>
                ) : (
                    emailList || formatMessage(MESSAGES.emailListEmpty)
                )}
            </Typography>
        </Tooltip>
    );
};
