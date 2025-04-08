import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';
import { ConfirmDialogWarningTitle } from '../../../components/dialogs/ConfirmDialogWarningTitle';
import MESSAGES from '../messages';

type Props = {
    onConfirm: () => void;
    allowConfirm: boolean;
};

export const ConfirmExportButton: FunctionComponent<Props> = ({
    onConfirm,
    allowConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <ConfirmDialog
            btnMessage={formatMessage(MESSAGES.export)}
            question={
                <ConfirmDialogWarningTitle
                    title={formatMessage(MESSAGES.exportTitle)}
                />
            }
            message={
                <Typography
                    variant="body2"
                    color="error"
                    component="span"
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    {formatMessage(MESSAGES.dhis2ExportMessage)}
                </Typography>
            }
            confirm={onConfirm}
            btnVariant="text"
            btnDisabled={!allowConfirm}
            tooltipMessage={
                !allowConfirm
                    ? formatMessage(MESSAGES.exportMessageDisabled)
                    : undefined
            }
        />
    );
};
