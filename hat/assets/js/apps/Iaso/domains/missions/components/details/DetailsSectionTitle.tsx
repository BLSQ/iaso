import React, { FC } from 'react';
import Stack from '@mui/material/Stack/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography/Typography';
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
    Icon: typeof SvgIcon;
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
