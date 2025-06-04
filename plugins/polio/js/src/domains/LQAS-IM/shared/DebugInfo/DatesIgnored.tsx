import React, { FunctionComponent } from 'react';
import { Typography, Box, Chip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { LqasImData } from '../../types';

type Props = {
    campaign?: string;
    data?: LqasImData;
};

export const DatesIgnored: FunctionComponent<Props> = ({ data, campaign }) => {
    const { formatMessage } = useSafeIntl();
    const currentCountryName =
        data && campaign && data?.stats[campaign]
            ? data.stats[campaign]?.country_name
            : null;

    const datesIgnored = currentCountryName
        ? (data?.day_country_not_found[currentCountryName] ?? {})
        : {};
    const datesArray = Object.keys(datesIgnored);
    return campaign && datesArray.length !== 0 ? (
        <>
            <Typography variant="h6">
                {`${formatMessage(MESSAGES.datesIgnored)}:`}
            </Typography>
            {datesArray.map(d => (
                <Box mr={1} mb={1} display="inline-block" key={d}>
                    <Chip label={d} variant="outlined" color="secondary" />
                </Box>
            ))}
        </>
    ) : null;
};
