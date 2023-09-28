import { CircularProgress, Tooltip, Typography } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';
import { useSafeIntl } from 'bluesquare-components';
import { useCountryUsersGroup } from '../../../CountryNotificationsConfig/requests';
import MESSAGES from '../../../../constants/messages';

export const EmailListForCountry = ({ countryId }) => {
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

EmailListForCountry.defaultProps = {
    countryId: null,
};

EmailListForCountry.propTypes = {
    countryId: PropTypes.number,
};
