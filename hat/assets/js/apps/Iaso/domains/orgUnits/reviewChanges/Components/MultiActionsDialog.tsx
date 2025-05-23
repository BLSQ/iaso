import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';

import ReportIcon from '@mui/icons-material/Report';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography,
} from '@mui/material';
import {
    ConfirmCancelModal,
    formatThousand,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';

import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { SxStyles } from '../../../../types/general';
import { DropdownOptions } from '../../../../types/utils';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { userHasPermission } from '../../../users/utils';
import { Selection } from '../../types/selection';
import { useBulkSaveChangeRequestStatus } from '../hooks/api/useBulkSaveChangeRequestStatus';
import MESSAGES from '../messages';
import {
    ChangeRequestValidationStatus,
    OrgUnitChangeRequest,
    ApproveOrgUnitParams,
} from '../types';

type Props = {
    open: boolean;
    closeDialog: () => void;
    selection: Selection<OrgUnitChangeRequest>;
    resetSelection: () => void;
    params: ApproveOrgUnitParams;
};

const styles: SxStyles = {
    title: {
        paddingBottom: 0,
    },
    content: {
        overflow: 'visible',
        paddingBottom: theme => theme.spacing(2),
    },
    action: {
        paddingBottom: theme => theme.spacing(2),
        paddingRight: theme => theme.spacing(2),
    },
    warningTitle: {
        display: 'flex',
        alignItems: 'center',
    },
    warningIcon: {
        display: 'inline-block',
        marginLeft: theme => theme.spacing(1),
        marginRight: theme => theme.spacing(1),
    },
    warningMessage: {
        display: 'flex',
        justifyContent: 'center',
    },
};

export const MultiActionsDialog: FunctionComponent<Props> = ({
    open,
    closeDialog,
    selection,
    resetSelection,
    params,
}) => {
    const { formatMessage } = useSafeIntl();
    const { selectCount } = selection;
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    const redirectTo = useRedirectTo();
    const [status, setStatus] = useState<
        ChangeRequestValidationStatus | undefined
    >(undefined);
    const [comment, setComment] = useState<string | undefined>(undefined);
    const { mutateAsync: bulkSaveStatus } =
        useBulkSaveChangeRequestStatus(params);
    const handleSave = useCallback(() => {
        if (!status) {
            return;
        }
        bulkSaveStatus({
            ...selection,
            status,
            rejection_comment: comment,
        });
        // TODO: handle error and not empty selection
        resetSelection();
        closeDialog();
    }, [
        bulkSaveStatus,
        closeDialog,
        resetSelection,
        selection,
        status,
        comment,
    ]);
    const onRedirect = useCallback(async () => {
        if (!status) {
            return;
        }
        await bulkSaveStatus({
            ...selection,
            status,
            rejection_comment: comment,
        });
        closeDialog();
        redirectTo(baseUrls.tasks, {
            order: '-created_at',
        });
    }, [status, bulkSaveStatus, selection, comment, closeDialog, redirectTo]);

    const statusOptions: DropdownOptions<string>[] = useMemo(
        () => [
            {
                label: formatMessage(MESSAGES.rejected),
                value: 'rejected',
            },
            {
                label: formatMessage(MESSAGES.approved),
                value: 'approved',
            },
        ],
        [formatMessage],
    );
    const handleChange = useCallback(
        (_, value) => {
            setStatus(value);
        },
        [setStatus],
    );
    const currentUser = useCurrentUser();
    const hasTaskPermission = userHasPermission(
        Permission.DATA_TASKS,
        currentUser,
    );
    if (!open) {
        return null;
    }
    return (
        <ConfirmCancelModal
            open={open}
            onClose={closeDialog}
            id="BulkSaveOrgUnitChangesDialog"
            dataTestId="BulkSaveOrgUnitChangesDialog"
            titleMessage={formatMessage(MESSAGES.changeSelectedChangeRequests, {
                count: selectCount,
            })}
            closeDialog={closeDialog}
            onConfirm={() => setOpenConfirmDialog(true)}
            onCancel={() => null}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
            closeOnConfirm={false}
            allowConfirm={!!status}
        >
            <InputComponent
                type="select"
                clearable
                keyValue="status"
                value={status}
                onChange={handleChange}
                options={statusOptions}
                labelString={formatMessage(MESSAGES.status)}
            />
            {status === 'rejected' && (
                <Box mt={2}>
                    <InputComponent
                        type="textarea"
                        keyValue=""
                        value={comment}
                        onChange={(_, newComment) => setComment(newComment)}
                        debounceTime={0}
                        withMarginTop={false}
                        labelString={formatMessage(
                            MESSAGES.addRejectionComment,
                        )}
                    />
                </Box>
            )}

            <Dialog
                open={openConfirmDialog}
                onClose={(event, reason) => {
                    if (reason === 'backdropClick') {
                        setOpenConfirmDialog(false);
                    }
                }}
            >
                <DialogTitle>
                    <Box sx={styles.warningTitle}>
                        <ReportIcon
                            sx={styles.warningIcon}
                            color="error"
                            fontSize="large"
                        />
                        {formatMessage(MESSAGES.confirmMultiChange)}
                        <ReportIcon
                            sx={styles.warningIcon}
                            color="error"
                            fontSize="large"
                        />
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        <Typography
                            variant="body2"
                            color="error"
                            component="span"
                            sx={styles.warningMessage}
                        >
                            {formatMessage(MESSAGES.bulkChangeCount, {
                                count: `${formatThousand(selectCount)}`,
                            })}
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setOpenConfirmDialog(false)}
                        color="primary"
                    >
                        {formatMessage(MESSAGES.no)}
                    </Button>
                    <Button onClick={handleSave} color="primary" autoFocus>
                        {formatMessage(MESSAGES.yes)}
                    </Button>
                    {hasTaskPermission && (
                        <Button onClick={onRedirect} color="primary" autoFocus>
                            {formatMessage(MESSAGES.goToCurrentTask)}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </ConfirmCancelModal>
    );
};
