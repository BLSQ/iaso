import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useCallback,
} from 'react';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import MESSAGES from '../messages';

type SubmitChangeRequest = (variables: UseSaveChangeRequestQueryData) => void;

type Props = {
    comment?: string;
    setIsCommentDialogOpen: Dispatch<SetStateAction<boolean>>;
    submitChangeRequest: SubmitChangeRequest;
    isPartiallyApproved: boolean;
    approvedFields: string[];
};
export const ReviewOrgUnitChangesCommentDialogButtons: FunctionComponent<
    Props
> = ({
    comment,
    setIsCommentDialogOpen,
    submitChangeRequest,
    isPartiallyApproved,
    approvedFields,
}) => {
    const { formatMessage } = useSafeIntl();
    const handleConfirm = useCallback(() => {
        setIsCommentDialogOpen(false);
        if (isPartiallyApproved) {
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
    }, [
        approvedFields,
        comment,
        isPartiallyApproved,
        setIsCommentDialogOpen,
        submitChangeRequest,
    ]);
    return (
        <>
            <Box pl={1} display="inline-block">
                <Button
                    data-test="cancel-comment-button"
                    onClick={() => setIsCommentDialogOpen(false)}
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
                    disabled={!comment || comment.length === 0}
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </Box>
        </>
    );
};
