import React, { FC, ReactNode } from 'react';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import { Box, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    root: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
    },
    icon: {
        fontSize: '18px',
        color: 'text.secondary',
    },
    name: {
        fontWeight: 500,
    },
};

type Props = {
    name: string;
    children?: ReactNode;
};

export const MissionFormName: FC<Props> = ({ name, children }) => (
    <Box sx={styles.root}>
        <DescriptionIcon sx={styles.icon} />
        <Typography sx={styles.name} variant="body2">
            {name}
        </Typography>
        {children}
    </Box>
);
