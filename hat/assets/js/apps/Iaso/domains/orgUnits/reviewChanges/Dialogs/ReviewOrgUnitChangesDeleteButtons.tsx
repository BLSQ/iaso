/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useCallback,
    SetStateAction,
    Dispatch,
} from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button } from '@mui/material';
import MESSAGES from '../messages';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';

type SubmitChangeRequest = (
    // eslint-disable-next-line no-unused-vars
    variables: UseSaveChangeRequestQueryData,
) => void;

type Props = {
    rejectedReason?: string;
    setIsRejectDialogOpen: Dispatch<SetStateAction<boolean>>;
    submitChangeRequest: SubmitChangeRequest;
};
export const ReviewOrgUnitChangesDeleteButtons: FunctionComponent<Props> = ({
    rejectedReason,
    setIsRejectDialogOpen,
    submitChangeRequest,
}) => {
    const { formatMessage } = useSafeIntl();

    const handleReject = useCallback(() => {
        setIsRejectDialogOpen(false);
        submitChangeRequest({
            status: 'rejected',
            rejection_comment: rejectedReason,
        });
    }, [rejectedReason, setIsRejectDialogOpen, submitChangeRequest]);
    return (
        <>
            <Box pl={1} display="inline-block">
                <Button
                    data-test="cancel-reject-button"
                    onClick={() => setIsRejectDialogOpen(false)}
                    autoFocus
                >
                    {formatMessage(MESSAGES.cancel)}
                </Button>
            </Box>
            <Box display="inline-block">
                <Button
                    data-test="confirm-reject-button"
                    onClick={handleReject}
                    variant="contained"
                    color="primary"
                    autoFocus
                    disabled={!rejectedReason || rejectedReason.length === 0}
                >
                    {formatMessage(MESSAGES.confirm)}
                </Button>
            </Box>
        </>
    );
};
