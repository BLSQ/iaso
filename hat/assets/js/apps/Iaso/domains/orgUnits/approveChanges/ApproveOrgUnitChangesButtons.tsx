/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useState } from 'react';
import { SimpleModal, useSafeIntl } from 'bluesquare-components';
import { Box, Button } from '@mui/material';
import MESSAGES from './messages';
import { NewField } from './hooks/useNewFields';
import { UseSaveChangeRequestQueryData } from './hooks/api/useSaveChangeRequest';
import { TextArea } from '../../../components/forms/TextArea';

type Props = {
    closeDialog: () => void;
    newFields: NewField[];
    isNew: boolean;
    submitChangeRequest: (
        // eslint-disable-next-line no-unused-vars
        variables: UseSaveChangeRequestQueryData,
    ) => void;
};

export const ApproveOrgUnitChangesButtons: FunctionComponent<Props> = ({
    closeDialog,
    newFields,
    isNew,
    submitChangeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const [isRejectDialogOpen, setIsRejectDialogOpen] =
        useState<boolean>(false);
    const [rejectedReason, setRejectedReason] = useState<string | undefined>();
    const selectedFields = newFields.filter(field => field.isSelected);
    const handleConfirm = useCallback(() => {
        submitChangeRequest({
            status: 'approved',
            approved_fields: selectedFields.map(field => field.key),
        });
    }, [selectedFields, submitChangeRequest]);
    const handleReject = useCallback(() => {
        setIsRejectDialogOpen(false);
        submitChangeRequest({
            status: 'rejected',
            approved_fields: [],
            rejection_comment: rejectedReason,
        });
    }, [rejectedReason, submitChangeRequest]);
    return (
        <>
            <SimpleModal
                open={isRejectDialogOpen}
                maxWidth="xs"
                onClose={() => null}
                id="approve-orgunit-reject-changes-dialog"
                dataTestId="approve-orgunit-reject-changes-dialog"
                titleMessage={formatMessage(MESSAGES.addComment)}
                closeDialog={() => setIsRejectDialogOpen(false)}
                buttons={() => (
                    <>
                        <Box pl={1} display="inline-block">
                            <Button
                                data-test="cancel-reject-button"
                                onClick={() => setIsRejectDialogOpen(false)}
                                variant="contained"
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
                                color="error"
                                autoFocus
                                disabled={
                                    !rejectedReason ||
                                    rejectedReason.length === 0
                                }
                            >
                                {formatMessage(MESSAGES.confirm)}
                            </Button>
                        </Box>
                    </>
                )}
            >
                <TextArea
                    label=""
                    value={rejectedReason}
                    onChange={newReason => setRejectedReason(newReason)}
                    debounceTime={0}
                />
            </SimpleModal>
            <Box display="flex" justifyContent="flex-end" m={2}>
                <Button
                    onClick={() => {
                        closeDialog();
                    }}
                    color="primary"
                    data-test="cancel-button"
                >
                    {formatMessage(MESSAGES.cancel)}
                </Button>
                {isNew && (
                    <>
                        <Box pl={1} display="inline-block">
                            <Button
                                data-test="reject-button"
                                onClick={() => setIsRejectDialogOpen(true)}
                                variant="contained"
                                color="error"
                                autoFocus
                            >
                                {formatMessage(MESSAGES.reject)}
                            </Button>
                        </Box>
                        <Box pl={1} display="inline-block">
                            <Button
                                data-test="confirm-button"
                                onClick={handleConfirm}
                                variant="contained"
                                color="primary"
                                autoFocus
                                disabled={selectedFields.length === 0}
                            >
                                {formatMessage(MESSAGES.validateSelected)}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </>
    );
};
