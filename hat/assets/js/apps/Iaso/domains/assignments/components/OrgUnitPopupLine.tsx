import React, { FunctionComponent, ReactElement } from 'react';
// @ts-ignore
import { Box } from '@mui/material';

type Props = {
    label: string;
    value: string | ReactElement;
};

export const OrgUnitPopupLine: FunctionComponent<Props> = ({
    label,
    value,
}) => {
    return (
        <Box display="flex" mb={1} alignItems="center">
            <Box display="inline-block" width="100px" textAlign="right" pr={1}>
                {label}:
            </Box>
            <Box display="inline-block" width="180px">
                {value}
            </Box>
        </Box>
    );
};
