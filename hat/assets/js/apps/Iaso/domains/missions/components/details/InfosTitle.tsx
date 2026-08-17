import React from 'react';
import { InfoOutlined } from '@mui/icons-material';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/missions/messages';

export const InfosTitle: React.FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Typography
            variant="body1"
            sx={{ textTransform: 'uppercase', mb: 2, fontSize: '15px' }}
        >
            <InfoOutlined
                color="primary"
                sx={{
                    mr: 1,
                    fontSize: '15px',
                    position: 'relative',
                    top: '2px',
                }}
            />
            {formatMessage(MESSAGES.generalInfoTitle)}
        </Typography>
    );
};
