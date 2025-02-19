import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';

import { Box } from '@mui/material';
import {
    ConfirmCancelModal,
    useRedirectTo,
    useSafeIntl,
} from 'bluesquare-components';

import InputComponent from '../../../../components/forms/InputComponent';
import { baseUrls } from '../../../../constants/urls';
import { DropdownOptions } from '../../../../types/utils';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { userHasPermission } from '../../../users/utils';
import { Selection } from '../../types/selection';
import { useBulkSaveChangeRequestStatus } from '../hooks/api/useBulkSaveChangeRequestStatus';
import MESSAGES from '../messages';
import { ChangeRequestValidationStatus, OrgUnitChangeRequest } from '../types';

type Props = {
    open: boolean;
    closeDialog: () => void;
    selection: Selection<OrgUnitChangeRequest>;
    resetSelection: () => void;
};

export const MultiActionsDialog: FunctionComponent<Props> = ({
    open,
    closeDialog,
    selection,
    resetSelection,
}) => {
    const { formatMessage } = useSafeIntl();
    const { selectCount } = selection;

    const redirectTo = useRedirectTo();
    const [status, setStatus] = useState<
        ChangeRequestValidationStatus | undefined
    >(undefined);
    const [comment, setComment] = useState<string | undefined>(undefined);
    const { mutateAsync: bulkSaveStatus } = useBulkSaveChangeRequestStatus();
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
            onConfirm={handleSave}
            onCancel={() => null}
            confirmMessage={MESSAGES.save}
            cancelMessage={MESSAGES.cancel}
            closeOnConfirm={false}
            allowConfirm={!!status}
            allowConfirmAdditionalButton={!!status && hasTaskPermission}
            additionalButton={hasTaskPermission}
            additionalMessage={
                hasTaskPermission ? MESSAGES.goToCurrentTask : undefined
            }
            onAdditionalButtonClick={hasTaskPermission ? onRedirect : undefined}
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
        </ConfirmCancelModal>
    );
};
