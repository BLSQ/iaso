import { Button, Grid } from '@mui/material';
import React, { FunctionComponent } from 'react';
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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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
                    data-test="cancel-button"
                >
                    {formatMessage(MESSAGES.no)}
                </Button>
                <Button
                    data-test="confirm-button"
                    onClick={() => {
                        onConfirm();
                    }}
                    color="primary"
                >
                    {formatMessage(MESSAGES.yes)}
                </Button>
            </Grid>
        </Grid>
    );
};
