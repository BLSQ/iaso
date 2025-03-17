import React, { FunctionComponent } from 'react';
import ReportIcon from '@mui/icons-material/Report';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';
import MESSAGES from '../messages';

type Props = {
    onConfirm: () => void;
    allowConfirm: boolean;
};

export const ConfirmSyncButton: FunctionComponent<Props> = ({
    onConfirm,
    allowConfirm,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <ConfirmDialog
            btnMessage={formatMessage(MESSAGES.export)}
            question={
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <ReportIcon
                        sx={{
                            display: 'inline-block',
                            marginLeft: theme => theme.spacing(1),
                            marginRight: theme => theme.spacing(1),
                        }}
                        color="error"
                        fontSize="large"
                    />
                    {formatMessage(MESSAGES.dhis2ExportTitle)}SYNC
                    <ReportIcon
                        sx={{
                            display: 'inline-block',
                            marginLeft: theme => theme.spacing(1),
                            marginRight: theme => theme.spacing(1),
                        }}
                        color="error"
                        fontSize="large"
                    />
                </Box>
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
        />
    );
};
