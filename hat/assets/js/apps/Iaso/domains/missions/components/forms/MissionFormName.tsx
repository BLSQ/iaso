import React, { FC } from 'react';
import DescriptionIcon from '@mui/icons-material/DescriptionOutlined';
import Box from '@mui/material/Box/Box';
import Typography from '@mui/material/Typography/Typography';
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
};

export const MissionFormName: FC<Props> = ({ name }) => (
    <Box sx={styles.root}>
        <DescriptionIcon sx={styles.icon} />
        <Typography sx={styles.name} variant="body2">
            {name}
        </Typography>
    </Box>
);
