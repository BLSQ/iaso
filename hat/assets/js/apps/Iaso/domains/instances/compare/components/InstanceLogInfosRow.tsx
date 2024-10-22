import React, { ReactNode } from 'react';
import { Grid, Typography } from '@mui/material';

interface Props {
    label: string;
    value: ReactNode | string;
    valueColor?: string;
    isValueLink?: boolean;
}

const InstanceLogInfosRow: React.FunctionComponent<Props> = ({
    label,
    value,
    valueColor = 'inherit',
    isValueLink = false,
}) => (
    <>
        <Grid
            xs={5}
            container
            alignItems="center"
            item
            justifyContent="flex-end"
        >
            <Typography variant="body2" color={valueColor}>
                {label} :
            </Typography>
        </Grid>
        <Grid
            xs={7}
            container
            alignItems="center"
            item
            justifyContent="flex-start"
        >
            <Typography variant="body2" color={valueColor}>
                {isValueLink ? value : value}
            </Typography>
        </Grid>
    </>
);

export default InstanceLogInfosRow;
