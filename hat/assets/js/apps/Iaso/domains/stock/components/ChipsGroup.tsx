import React from 'react';
import { Box, Chip } from '@mui/material';
import { textPlaceholder } from 'Iaso/constants/uiConstants';

export const ChipsGroup = (objects: any[]) => {
    if (objects.length === 0) return textPlaceholder;
    return (
        <Box
            sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 0.5,
                justifyContent: 'center',
            }}
        >
            {objects.map(object => (
                <Chip key={object.id} label={object.name} size="small" />
            ))}
        </Box>
    );
};
