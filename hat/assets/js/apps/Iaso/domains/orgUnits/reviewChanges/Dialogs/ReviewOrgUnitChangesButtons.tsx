/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useState } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Box, Button } from '@mui/material';
import MESSAGES from '../messages';
import { NewOrgUnitField } from '../hooks/useNewFields';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import { ReviewOrgUnitChangesDeleteDialog } from './ReviewOrgUnitChangesDeleteDialog';
import { OrgUnitChangeRequestDetails } from '../types';

type SubmitChangeRequest = (
    // eslint-disable-next-line no-unused-vars
    variables: UseSaveChangeRequestQueryData,
) => void;

type Props = {
    closeDialog: () => void;
    newFields: NewOrgUnitField[];
    isNew: boolean;
    isNewOrgUnit: boolean;
    submitChangeRequest: SubmitChangeRequest;
    changeRequest?: OrgUnitChangeRequestDetails;
};

export const ApproveOrgUnitChangesButtons: FunctionComponent<Props> = ({
    closeDialog,
    newFields,
    isNew,
    isNewOrgUnit,
    submitChangeRequest,
    changeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const selectedFields = newFields.filter(field => field.isSelected);

    const [isRejectDialogOpen, setIsRejectDialogOpen] =
        useState<boolean>(false);
    const handleConfirm = useCallback(() => {
        submitChangeRequest({
            status: 'approved',
            approved_fields:
                isNewOrgUnit && changeRequest
                    ? [...changeRequest.requested_fields]
                    : selectedFields.map(field => `new_${field.key}`),
        });
    }, [changeRequest, isNewOrgUnit, selectedFields, submitChangeRequest]);
    const allowConfirm = isNewOrgUnit || selectedFields.length > 0;
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
                    {isNew
                        ? formatMessage(MESSAGES.cancel)
                        : formatMessage(MESSAGES.close)}
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
                                disabled={!allowConfirm}
                            >
                                {isNewOrgUnit
                                    ? formatMessage(MESSAGES.createOrgUnit)
                                    : formatMessage(MESSAGES.validateSelected)}
                            </Button>
                        </Box>
                    </>
                )}
            </Box>
        </>
    );
};
