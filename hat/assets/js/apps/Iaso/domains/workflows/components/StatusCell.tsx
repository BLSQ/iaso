import React, { FunctionComponent, useMemo } from 'react';
import { useTheme } from '@mui/material';

import { Status } from '../types';

import { useGetStatus } from '../hooks/useGetStatus';

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
    const statusList = useGetStatus();
    const currentStatus = useMemo(
        () => statusList.find(stat => stat.value === status),
        [status, statusList],
    );
    return <span style={{ color }}>{currentStatus?.label || status}</span>;
};
