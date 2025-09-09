import { Box } from '@mui/material';
import React from 'react';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import PdfSvgComponent from '../../../../../../../../hat/assets/js/apps/Iaso/components/svg/PdfSvgComponent';

export const OpenButtonComponent = ({ onClick, date }) => (
    <Box
        role="button"
        onClick={onClick}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
        {DateCell({ value: date })}
        <Box
            component="span"
            sx={{ marginLeft: 1, position: 'relative', top: 3 }}
        >
            <PdfSvgComponent sx={{ fontSize: '1.2rem' }} />
        </Box>
    </Box>
);
