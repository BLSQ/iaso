import React, { FunctionComponent, ReactElement } from 'react';
// @ts-ignore
import { Box } from '@material-ui/core';

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
            <Box display="inline-block" width="100px">
                {label}:
            </Box>{' '}
            {value}
        </Box>
    );
};
