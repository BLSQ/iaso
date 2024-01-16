/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button } from '@mui/material';
import MESSAGES from '../messages';
import { NewOrgUnitField } from '../hooks/useNewFields';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import { ReviewOrgUnitChangesDeleteDialog } from './ReviewOrgUnitChangesDeleteDialog';

type SubmitChangeRequest = (
    // eslint-disable-next-line no-unused-vars
    variables: UseSaveChangeRequestQueryData,
) => void;

type Props = {
    closeDialog: () => void;
    newFields: NewOrgUnitField[];
    isNew: boolean;
    submitChangeRequest: SubmitChangeRequest;
};

export const ApproveOrgUnitChangesButtons: FunctionComponent<Props> = ({
    closeDialog,
    newFields,
    isNew,
    submitChangeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const selectedFields = newFields.filter(field => field.isSelected);

    const [isRejectDialogOpen, setIsRejectDialogOpen] =
        useState<boolean>(false);
    const handleConfirm = useCallback(() => {
        submitChangeRequest({
            status: 'approved',
            approved_fields: selectedFields.map(field => field.key),
        });
    }, [selectedFields, submitChangeRequest]);
    return (
        <>
            <ReviewOrgUnitChangesDeleteDialog
                submitChangeRequest={submitChangeRequest}
                isRejectDialogOpen={isRejectDialogOpen}
                setIsRejectDialogOpen={setIsRejectDialogOpen}
            />
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
