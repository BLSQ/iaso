import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography, Box, Chip } from '@mui/material';
import { LqasImData } from '../../../constants/types';
import MESSAGES from '../../../constants/messages';

type Props = {
    // eslint-disable-next-line react/require-default-props
    campaign?: string;
    // eslint-disable-next-line react/require-default-props
    data?: LqasImData;
};

export const DatesIgnored: FunctionComponent<Props> = ({ data, campaign }) => {
    const { formatMessage } = useSafeIntl();
    const currentCountryName =
        data && campaign && data?.stats[campaign]
            ? data.stats[campaign]?.country_name
            : null;

    const datesIgnored = currentCountryName
        ? data?.day_country_not_found[currentCountryName] ?? {}
        : {};
    const datesArray = Object.keys(datesIgnored);
    return (
        <>
            {campaign && datesArray.length !== 0 && (
                <>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.datesIgnored)}:`}
                    </Typography>
                    {datesArray.map(d => (
                        <Box mr={1} mb={1} display="inline-block" key={d}>
                            <Chip
                                label={d}
                                variant="outlined"
                                color="secondary"
                            />
                        </Box>
                    ))}
                </>
            )}
        </>
    );
};
