import React, { ReactNode } from 'react';
import { Typography } from '@mui/material';

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
    <Typography
        variant="body2"
        color={valueColor}
        component="div"
        sx={{ mb: 0.5 }}
    >
        <b>{label} :</b> {value}
    </Typography>
);

export default InstanceLogInfosRow;
