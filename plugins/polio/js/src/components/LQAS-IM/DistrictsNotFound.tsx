import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography } from '@material-ui/core';
import { LqasImCampaign } from '../../constants/types';
import MESSAGES from '../../constants/messages';

type Props = {
    // eslint-disable-next-line react/require-default-props
    campaign?: string;
    // eslint-disable-next-line react/require-default-props
    data?: Record<string, LqasImCampaign>;
};

export const DistrictsNotFound: FunctionComponent<Props> = ({
    data,
    campaign,
}) => {
    const { formatMessage } = useSafeIntl();
    const districtsNotFound =
        data && campaign && data[campaign]
            ? data[campaign]?.districts_not_found?.join(', ')
            : null;
    return (
        <>
            {campaign && (
                <>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.districtsNotFound)}:`}
                    </Typography>
                    {districtsNotFound}
                </>
            )}
        </>
    );
};
