import React, { FunctionComponent } from 'react';
import { useTheme } from '@material-ui/core';

import { Status } from '../types/workflows';

type Props = {
    status: Status;
};

export const useGetColor = (status: Status): string => {
    const theme = useTheme();
    switch (status) {
        case 'DRAFT':
            return theme.palette.warning.main;
        case 'UNPUBLISHED':
            return theme.palette.error.main;
        case 'PUBLISHED':
            return theme.palette.success.main;
        default:
            return theme.palette.text.primary;
    }
};

export const StatusCell: FunctionComponent<Props> = ({ status }) => {
    const color = useGetColor(status);
    return <span style={{ color }}>{status}</span>;
};
