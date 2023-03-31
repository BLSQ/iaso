import { Button, Grid } from '@material-ui/core';
import React, { FunctionComponent } from 'react';
import { CsvSvg, useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';
import { useDownloadButtonStyles } from '../DownloadButtonsComponent';

type Props = {
    closeDialog: () => void;
    allowConfirm: boolean;
    onConfirm: () => void;
    onCancel?: () => void;
    isLoading: boolean;
    url: string;
};

export const FileUploadButtons: FunctionComponent<Props> = ({
    closeDialog,
    allowConfirm,
    onConfirm,
    isLoading,
    url,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onCancel = () => {},
}) => {
    const buttonStyles = useDownloadButtonStyles();
    const { formatMessage } = useSafeIntl();
    const cancelMessage = !isLoading
        ? formatMessage(MESSAGES.cancel)
        : formatMessage(MESSAGES.close);
    return (
        <Grid container justifyContent="space-between">
            <Grid item>
                <Button
                    data-test="csv-export-button"
                    className={buttonStyles.button}
                    color="primary"
                    href={url}
                    disabled={isLoading}
                    variant="outlined"
                >
                    <CsvSvg />
                    {formatMessage(MESSAGES.downloadTemplate)}
                </Button>
            </Grid>
            <Grid>
                <Button
                    onClick={() => {
                        onCancel();
                        closeDialog();
                    }}
                    color="primary"
                    data-test="cancel-button"
                >
                    {cancelMessage}
                </Button>
                <Button
                    data-test="confirm-button"
                    onClick={() => {
                        onConfirm();
                    }}
                    disabled={!allowConfirm}
                    color="primary"
                    autoFocus
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </Grid>
        </Grid>
    );
};
