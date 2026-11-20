import React, { FC, ReactNode } from 'react';
import Stack from '@mui/material/Stack/Stack';
import Typography from '@mui/material/Typography/Typography';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    icon: ReactNode;
    label: string;
};

const styles = {
    root: {
        color: 'text.secondary',
    },
} satisfies SxStyles;

export const CaptionItem: FC<Props> = ({ icon, label }) => (
    <Stack direction="row" alignItems="center" gap={0.5} sx={styles.root}>
        {icon}
        <Typography variant="caption">{label}</Typography>
    </Stack>
);
