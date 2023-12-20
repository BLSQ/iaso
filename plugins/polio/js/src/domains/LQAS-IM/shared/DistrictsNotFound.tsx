import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography, Chip, Box } from '@mui/material';
import { LqasImCampaign } from '../../../constants/types';
import MESSAGES from '../../../constants/messages';

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
            ? data[campaign].districts_not_found
            : [];
    return (
        <>
            {campaign && districtsNotFound.length > 0 && (
                <>
                    <Typography variant="h6">
                        {`${formatMessage(MESSAGES.districtsNotFound)}:`}
                    </Typography>
                    <Box mt={2}>
                        {districtsNotFound.map(d => (
                            <Box mr={1} mb={1} display="inline-block" key={d}>
                                <Chip
                                    label={d}
                                    variant="outlined"
                                    color="secondary"
                                />
                            </Box>
                        ))}
                    </Box>
                </>
            )}
        </>
    );
};
