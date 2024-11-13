import React, { ReactNode } from 'react';
import { Stack, Typography } from '@mui/material';

interface Props {
    label: string;
    value: ReactNode | string;
    valueColor?: string;
}

const InstanceLogInfosRow: React.FunctionComponent<Props> = ({
    label,
    value,
    valueColor = 'inherit',
}) => (
    <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color={valueColor}>
            <b>{label} :</b>
        </Typography>

        <Typography variant="body2" color={valueColor}>
            {value}
        </Typography>
    </Stack>
);

export default InstanceLogInfosRow;
