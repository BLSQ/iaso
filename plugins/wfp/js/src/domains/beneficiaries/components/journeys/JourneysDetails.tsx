import React from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Beneficiary } from '../../types';
import { Journeys } from './Journeys';

export const JourneysDetails = (beneficiary?: Beneficiary) =>
    beneficiary ? (
        <Box
            sx={theme => ({
                p: 2,
                background: alpha(theme.palette.primary.main, 0.04),
                textAlign: 'left',
            })}
        >
            <Journeys beneficiary={beneficiary} />
        </Box>
    ) : null;
