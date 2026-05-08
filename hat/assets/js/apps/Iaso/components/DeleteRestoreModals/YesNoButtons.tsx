import React, { FunctionComponent } from 'react';
import { Button, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MESSAGES } from './messages';

type Props = {
    closeDialog: () => void;
    onConfirm: () => void;
    onCancel?: () => void;
};

export const YesNoButtons: FunctionComponent<Props> = ({
    closeDialog,
    onConfirm,

    onCancel = () => {},
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Grid container justifyContent="flex-end" spacing={2}>
            <Grid>
                <Button
                    onClick={() => {
                        onCancel();
                        closeDialog();
                    }}
                    color="primary"
                    data-testid="cancel-button"
                >
                    {formatMessage(MESSAGES.no)}
                </Button>
                <Button
                    data-testid="confirm-button"
                    onClick={() => {
                        onConfirm();
                        closeDialog();
                    }}
                    color="primary"
                >
                    {formatMessage(MESSAGES.yes)}
                </Button>
            </Grid>
        </Grid>
    );
};
