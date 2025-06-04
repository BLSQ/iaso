import React, { FunctionComponent, useCallback } from 'react';
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import MESSAGES from '../messages';

type SubmitChangeRequest = (variables: UseSaveChangeRequestQueryData) => void;

type Props = {
    comment?: string;
    onClose: () => void;
    submitChangeRequest: SubmitChangeRequest;
    isApproved: boolean;
    isPartiallyApproved: boolean;
    approvedFields: string[];
};
export const ReviewOrgUnitChangesConfirmDialogButtons: FunctionComponent<
    Props
> = ({
    comment,
    onClose,
    submitChangeRequest,
    isApproved,
    isPartiallyApproved,
    approvedFields,
}) => {
    const { formatMessage } = useSafeIntl();
    const needsComment = Boolean(!isApproved || isPartiallyApproved);
    const confirmButtonDisabled = Boolean(
        needsComment && (!comment || comment.length === 0),
    );
    const handleConfirm = useCallback(() => {
        onClose();
        if (isApproved) {
            submitChangeRequest({
                status: 'approved',
                approved_fields: approvedFields,
                rejection_comment: comment,
            });
        } else {
            submitChangeRequest({
                status: 'rejected',
                rejection_comment: comment,
            });
        }
    }, [approvedFields, comment, isApproved, onClose, submitChangeRequest]);
    return (
        <>
            <Box pl={1} display="inline-block">
                <Button
                    data-test="cancel-comment-button"
                    onClick={() => onClose()}
                    autoFocus
                >
                    {formatMessage(MESSAGES.cancel)}
                </Button>
            </Box>
            <Box display="inline-block">
                <Button
                    data-test="confirm-comment-button"
                    onClick={handleConfirm}
                    variant="contained"
                    color="primary"
                    autoFocus
                    disabled={confirmButtonDisabled}
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </Box>
        </>
    );
};
