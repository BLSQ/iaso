import React, { FunctionComponent, useCallback, useState } from 'react';
import {
    Tooltip,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
    Alert,
} from '@mui/material';
import {
    InputWithInfos,
    LoadingSpinner,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';

import { ConfirmDialogWarningTitle } from '../../../../components/dialogs/ConfirmDialogWarningTitle';
import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { useCreateDataSourceVersionsSync } from '../../hooks/useCreateDataSourceVersionsSync';
import { useCreateJsonDiffAsync } from '../../hooks/useCreateJsonDiffAsync';
import { useLaunchDiff } from '../../hooks/useLaunchDiff';
import MESSAGES from '../../messages';
import { SyncResponse } from '../../types/sync';
import { VersionFields } from '../VersionPicker';
import { ConfirmSyncPreview } from './ConfirmSyncPreview';

type Props = {
    closeMainDialog: () => void;
    allowConfirm: boolean;
    refSourceVersionId: number;
    targetSourceVersionId: number;
    sourceFields: VersionFields;
    targetFields: VersionFields;
    fieldsToExport: string[];
};

//  Steps to sync:
// POST on /api/datasources/sync/ to create a new DataSourceVersionsSynchronization object
// PATCH on /api/datasources/sync/{id}/create_json_diff_async/ to compute the differences asynchronously
// PATCH on /api/datasources/sync/{id}/synchronize_source_versions_async/ to create change requests asynchronously

export const ConfirmSyncButton: FunctionComponent<Props> = ({
    closeMainDialog,
    allowConfirm,
    refSourceVersionId,
    targetSourceVersionId,
    sourceFields,
    targetFields,
    fieldsToExport,
}) => {
    const { formatMessage } = useSafeIntl();
    const redirectTo = useRedirectTo();

    const [open, setOpen] = useState<boolean>(false);
    const [isPreviewDone, setIsPreviewDone] = useState<boolean>(false);
    const [errors, setErrors] = useState<string[]>([]);
    const [jsonDiffResult, setJsonDiffResult] = useState<
        SyncResponse | undefined
    >(undefined);

    const [syncId, setSyncId] = useState<number | undefined>(undefined);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [syncName, setSyncName] = useState<string | undefined>(undefined);
    const { mutateAsync: createDataSourceVersionsSync } =
        useCreateDataSourceVersionsSync();
    const { mutateAsync: createJsonDiffAsync } = useCreateJsonDiffAsync();
    const { mutateAsync: launchDiff } = useLaunchDiff();
    const handleSeePreview = useCallback(async () => {
        setIsLoading(true);
        try {
            let result;
            if (!syncId) {
                result = await createDataSourceVersionsSync({
                    name: syncName,
                    refSourceVersionId,
                    targetSourceVersionId,
                });
                setSyncId(result.id);
            }
            const diffResult = await createJsonDiffAsync({
                id: syncId || result.id,
                sourceFields,
                targetFields,
                fieldsToExport,
            });
            setIsPreviewDone(true);
            setJsonDiffResult(diffResult);
        } catch (error) {
            setIsPreviewDone(false);
            setSyncId(undefined);
            Object.entries(error.details).forEach(([_key, value]) => {
                setErrors(prev => [...prev, `${value}`]);
            });
        } finally {
            setIsLoading(false);
        }
    }, [
        createDataSourceVersionsSync,
        createJsonDiffAsync,
        fieldsToExport,
        refSourceVersionId,
        sourceFields,
        syncName,
        targetFields,
        targetSourceVersionId,
        syncId,
    ]);
    const handleClose = useCallback(() => {
        setOpen(false);
        setIsPreviewDone(false);
        setIsLoading(false);
        setSyncName(undefined);
        setJsonDiffResult(undefined);
    }, []);

    const handleOnConfirm = useCallback(
        goToCurrentTask => {
            setOpen(false);
            if (jsonDiffResult) {
                launchDiff({ id: jsonDiffResult.id });
                if (!goToCurrentTask) {
                    handleClose();
                    closeMainDialog();
                } else {
                    redirectTo(baseUrls.tasks, {
                        order: '-created_at',
                    });
                }
            }
        },
        [jsonDiffResult, launchDiff, handleClose, closeMainDialog, redirectTo],
    );

    const isDisabled: boolean = !syncName || isLoading;
    const isConfirmDisabled: boolean =
        !isPreviewDone ||
        isLoading ||
        !jsonDiffResult ||
        (jsonDiffResult.count_create === 0 &&
            jsonDiffResult.count_update === 0);
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
                maxWidth="xs"
                fullWidth
                open={open}
                onClose={(_event, reason) => {
                    if (reason === 'backdropClick') {
                        handleClose();
                    }
                }}
            >
                <DialogTitle>
                    <ConfirmDialogWarningTitle
                        title={formatMessage(MESSAGES.syncTitle)}
                    />
                </DialogTitle>
                <Divider />
                <DialogContent>
                    {isLoading && <LoadingSpinner absolute />}

                    <InputWithInfos
                        infos={formatMessage(MESSAGES.syncNameInfos)}
                    >
                        <InputComponent
                            keyValue="syncName"
                            onChange={(_key, value) => {
                                setSyncName(value);
                            }}
                            value={syncName}
                            errors={[]}
                            type="text"
                            label={MESSAGES.syncName}
                            required
                        />
                    </InputWithInfos>
                    <ConfirmSyncPreview
                        jsonDiffResult={jsonDiffResult}
                        isDisabled={isDisabled}
                        handleSeePreview={handleSeePreview}
                    />
                    {errors.length > 0 && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {errors.map(error => (
                                <Box key={error}>{error}</Box>
                            ))}
                        </Alert>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        {formatMessage(MESSAGES.cancel)}
                    </Button>
                    <Tooltip
                        title={
                            isConfirmDisabled
                                ? formatMessage(MESSAGES.syncTooltip)
                                : undefined
                        }
                    >
                        <Box>
                            <Button
                                onClick={() => handleOnConfirm(false)}
                                color="primary"
                                autoFocus
                                disabled={isConfirmDisabled}
                            >
                                {formatMessage(MESSAGES.launch)}
                            </Button>
                            <Button
                                onClick={() => handleOnConfirm(true)}
                                color="primary"
                                autoFocus
                                disabled={isConfirmDisabled}
                            >
                                {formatMessage(MESSAGES.goToCurrentTask)}
                            </Button>
                        </Box>
                    </Tooltip>
                </DialogActions>
            </Dialog>
        </>
    );
};
