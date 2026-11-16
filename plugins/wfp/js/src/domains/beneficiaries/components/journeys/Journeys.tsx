import React, { FunctionComponent } from 'react';
import { Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { Beneficiary } from '../../types';
import { Visits } from '../visits/Visits';
import { Header } from './Header';

export const Journeys: FunctionComponent<{ beneficiary: Beneficiary }> = ({
    beneficiary,
}) => {
    const { formatMessage } = useSafeIntl();
    if (beneficiary.journeys.length === 0) {
        return (
            <Typography color="textSecondary" sx={{ pt: 1.5 }}>
                {formatMessage(MESSAGES.noJourneys)}
            </Typography>
        );
    }
    return (
        <>
            {beneficiary.journeys.map((journey, index) => (
                <Paper key={journey.id} sx={{ mt: 1.5, overflow: 'hidden' }}>
                    <Header journey={journey} number={index + 1} />
                    <Visits journey={journey} visits={journey.visits} />
                </Paper>
            ))}
        </>
    );
};
