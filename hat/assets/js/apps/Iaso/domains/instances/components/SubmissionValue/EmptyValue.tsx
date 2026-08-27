import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';

export const EmptyValue: FunctionComponent = () => (
    <Typography component="span" sx={{ color: 'text.disabled' }}>
        {textPlaceholder}
    </Typography>
);
