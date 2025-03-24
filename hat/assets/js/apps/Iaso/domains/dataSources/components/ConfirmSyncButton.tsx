import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    Typography,
    Tooltip,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Divider,
} from '@mui/material';
import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { ConfirmDialogWarningTitle } from '../../../components/dialogs/ConfirmDialogWarningTitle';
import InputComponent from '../../../components/forms/InputComponent';
import { useCreateDataSourceVersionsSync } from '../hooks/useCreateDataSourceVersionsSync';
import MESSAGES from '../messages';

type Props = {
    onConfirm: () => void;
    allowConfirm: boolean;
    refSourceVersionId: number;
    targetSourceVersionId: number;
};
//  Steps to sync:
// POST on /api/datasources/sync/ to create a new DataSourceVersionsSynchronization object
// PATCH on /api/datasources/sync/{id}/create_json_diff_async/ to compute the differences asynchronously

export const ConfirmSyncButton: FunctionComponent<Props> = ({
    onConfirm,
    allowConfirm,
    refSourceVersionId,
    targetSourceVersionId,
}) => {
    const { formatMessage } = useSafeIntl();

    const [open, setOpen] = useState<boolean>(false);
    const [isPreviewDone, setIsPreviewDone] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [syncName, setSyncName] = useState<string | undefined>(undefined);
    const { mutateAsync: createDataSourceVersionsSync } =
        useCreateDataSourceVersionsSync();
    const handleSeePreview = useCallback(async () => {
        setIsLoading(true);
        const result = await createDataSourceVersionsSync({
            name: syncName,
            refSourceVersionId,
            targetSourceVersionId,
        });
        console.log('result', result);
        // - Set loading state
        // - call the API to create a new DataSourceVersionsSynchronization object => POST on /api/datasources/sync/
        // - call the API to compute the differences asynchronously => PATCH on /api/datasources/sync/{id}/create_json_diff_async/
        // - remove loading state

        setIsLoading(false);
        setIsPreviewDone(true);
        // - display result in the dialog
    }, [
        createDataSourceVersionsSync,
        refSourceVersionId,
        syncName,
        targetSourceVersionId,
    ]);
    const handleClose = useCallback(() => {
        setOpen(false);
        setIsPreviewDone(false);
        setIsLoading(false);
        setSyncName(undefined);
    }, []);

    const handleOnConfirm = useCallback(
        goToCurrentTask => {
            setOpen(false);
            // PATCH on /api/datasources/sync/{id}/synchronize_source_versions_async/ to create change requests asynchronously
            if (!goToCurrentTask) {
                console.log('confirm');
                handleClose();
                onConfirm();
            } else {
                console.log('go to current task');
            }
        },
        [onConfirm, handleClose],
    );

    const isDisabled: boolean = !syncName || isLoading;

    return (
        <>
            <Tooltip
                title={
                    !allowConfirm
                        ? formatMessage(MESSAGES.syncMessageDisabled)
                        : undefined
                }
            >
                <Box>
                    <Button
                        variant="text"
                        size="medium"
                        color="primary"
                        disabled={!allowConfirm}
                        onClick={() => setOpen(true)}
                    >
                        {formatMessage(MESSAGES.sync)}
                    </Button>
                </Box>
            </Tooltip>
            <Dialog
                open={open}
                onClose={(_event, reason) => {
                    if (reason === 'backdropClick') {
                        handleClose();
                    }
                }}
            >
                <DialogTitle>
                    <ConfirmDialogWarningTitle
                        title={formatMessage(MESSAGES.exportTitle)}
                    />
                </DialogTitle>
                <Divider />
                <DialogContent>
                    {isLoading && <LoadingSpinner absolute />}
                    <Box>
                        <InputComponent
                            keyValue="short_name"
                            onChange={(_key, value) => {
                                setSyncName(value);
                            }}
                            value={syncName}
                            errors={[]}
                            type="text"
                            label={MESSAGES.name}
                            required
                        />
                    </Box>
                    <DialogContentText id="alert-dialog-description">
                        <Typography
                            variant="body2"
                            color="error"
                            component="span"
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            {formatMessage(MESSAGES.syncMessage)}
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        {formatMessage(MESSAGES.cancel)}
                    </Button>
                    <Button
                        onClick={handleSeePreview}
                        color="primary"
                        disabled={isDisabled}
                    >
                        {formatMessage(MESSAGES.csvPreview)}
                    </Button>
                    <Button
                        onClick={() => handleOnConfirm(false)}
                        color="primary"
                        autoFocus
                        disabled={!isPreviewDone}
                    >
                        {formatMessage(MESSAGES.confirm)}
                    </Button>
                    <Button
                        onClick={() => handleOnConfirm(true)}
                        color="primary"
                        autoFocus
                        disabled={!isPreviewDone}
                    >
                        {formatMessage(MESSAGES.goToCurrentTask)}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
