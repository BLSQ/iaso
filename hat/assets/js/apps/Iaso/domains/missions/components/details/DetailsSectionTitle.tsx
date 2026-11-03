import React, { FC } from 'react';
import { SvgIconComponent } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    icon: {
        fontSize: 20,
        color: 'text.primary',
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 600,
    },
};

type Props = {
    Icon: SvgIconComponent;
    title: string;
};

export const DetailsSectionTitle: FC<Props> = ({ Icon, title }) => (
    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
        <Icon sx={styles.icon} />
        <Typography component="h2" sx={styles.title}>
            {title}
        </Typography>
    </Stack>
);
