import React from 'react';
import { useTheme } from '@mui/material';
import { ColorChip, useSafeIntl } from 'bluesquare-components';
import MESSAGES from 'Iaso/domains/validationWorkflowInstances/messages';

const useGetColor = (status?: string): string => {
    const theme = useTheme();
    switch (status?.toUpperCase()) {
        case 'APPROVED':
            return theme.palette.success.main;
        case 'REJECTED':
            return theme.palette.error.main;
        case 'PENDING':
            return theme.palette.primary.main;
        default:
            return theme.palette.primary.main;
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
    const color = useGetColor(status);
    const label = useGetStatusLabel(status) || '';
    return (
        <ColorChip
            color={color}
            label={label}
            data-testid="validation-status-chip"
        />
    );
};
