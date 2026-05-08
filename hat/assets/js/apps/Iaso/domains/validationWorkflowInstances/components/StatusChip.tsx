import React from 'react';
import { Chip, ChipProps } from '@mui/material';

type Status = 'APPROVED' | 'REJECTED' | 'PENDING';
const getColor = (status: Status): ChipProps['color'] => {
    switch (status) {
        case 'APPROVED':
            return 'success';
        case 'REJECTED':
            return 'error';
        case 'PENDING':
            return 'primary';
        default:
            return 'primary';
    }
};
export const StatusChip = ({ status }: { status: Status }) => {
    return <Chip color={getColor(status)} label={status} />;
};
