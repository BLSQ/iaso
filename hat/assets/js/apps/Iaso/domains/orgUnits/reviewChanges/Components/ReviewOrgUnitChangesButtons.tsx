import React, { FunctionComponent, useMemo, useState } from 'react';
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import { NewOrgUnitField } from '../hooks/useNewFields';
import MESSAGES from '../messages';
import { OrgUnitChangeRequestDetails } from '../types';
import { ReviewOrgUnitChangesConfirmDialog } from './ReviewOrgUnitChangesConfirmDialog';

type SubmitChangeRequest = (variables: UseSaveChangeRequestQueryData) => void;

type Props = {
    newFields: NewOrgUnitField[];
    isNew: boolean;
    isNewOrgUnit: boolean;
    submitChangeRequest: SubmitChangeRequest;
    changeRequest?: OrgUnitChangeRequestDetails;
};

export const ApproveOrgUnitChangesButtons: FunctionComponent<Props> = ({
    newFields,
    isNew,
    isNewOrgUnit,
    submitChangeRequest,
    changeRequest,
}) => {
    const { formatMessage } = useSafeIntl();
    const selectedFields = newFields.filter(field => field.isSelected);

    const [isConfirmDialogOpen, setIsConfirmDialogOpen] =
        useState<boolean>(false);

    const approvedFields: string[] = useMemo(() => {
        return isNewOrgUnit && changeRequest
            ? [...changeRequest.requested_fields]
            : selectedFields.map(field => `new_${field.key}`);
    }, [isNewOrgUnit, changeRequest, selectedFields]);

    const [isRejected, setIsRejected] = useState<boolean>(false);
    const isPartiallyApproved = Boolean(
        changeRequest?.requested_fields &&
            changeRequest?.requested_fields.length > approvedFields.length &&
            approvedFields.length > 0,
    );

    const allowConfirm = isNewOrgUnit || selectedFields.length > 0;
    return (
        <>
            <ReviewOrgUnitChangesConfirmDialog
                submitChangeRequest={submitChangeRequest}
                open={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                isPartiallyApproved={isPartiallyApproved}
                approvedFields={approvedFields}
                isNewOrgUnit={isNewOrgUnit}
                isRejected={isRejected}
            />
            <Box display="flex" justifyContent="flex-end" m={2}>
                {isNew && (
                    <>
                        <Box pl={1} display="inline-block">
                            <Button
                                data-test="reject-button"
                                onClick={() => {
                                    setIsRejected(true);
                                    setIsConfirmDialogOpen(true);
                                }}
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
                                onClick={() => {
                                    setIsRejected(false);
                                    setIsConfirmDialogOpen(true);
                                }}
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
