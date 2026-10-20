import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/validationWorkflowInstances/messages';

const getColor = (status?: string): ChipProps['color'] => {
    switch (status?.toUpperCase()) {
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
export const useGetStatusLabel = (status?: string): string | undefined => {
    const { formatMessage } = useSafeIntl();
    switch (status?.toUpperCase()) {
        case 'APPROVED':
            return formatMessage(MESSAGES.statusApproved);
        case 'REJECTED':
            return formatMessage(MESSAGES.statusRejected);
        case 'PENDING':
            return formatMessage(MESSAGES.statusPending);
        default:
            return status;
    }
};
export const StatusChip = ({ status }: { status: string }) => {
    return (
        <Chip
            color={getColor(status)}
            label={useGetStatusLabel(status)}
            data-testid="validation-status-chip"
        />
    );
};
