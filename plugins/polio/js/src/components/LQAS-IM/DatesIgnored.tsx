import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography } from '@material-ui/core';
import { LqasImData } from '../../constants/types';
import MESSAGES from '../../constants/messages';

type Props = {
    // eslint-disable-next-line react/require-default-props
    campaign?: string;
    // eslint-disable-next-line react/require-default-props
    data?: LqasImData;
};

export const DatesIgnored: FunctionComponent<Props> = ({ data, campaign }) => {
    const { formatMessage } = useSafeIntl();
    const currentCountryName =
        data && campaign && data[campaign]
            ? data.stats[campaign]?.country_name
            : null;

    const datesIgnored = currentCountryName
        ? data?.day_country_not_found[currentCountryName] ?? {}
        : {};

    return (
        <>
            {campaign && (
                <>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.datesIgnored)}:`}
                    </Typography>
                    {Object.keys(datesIgnored ?? {}).join(', ')}
                </>
            )}
        </>
    );
};
