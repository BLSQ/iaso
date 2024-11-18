import { Box } from '@mui/material';
import React from 'react';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';

export const OpenButtonComponent = ({ onClick, date }) => (
    <Box role="button" onClick={onClick}>
        {DateCell({ value: date })}
    </Box>
);
