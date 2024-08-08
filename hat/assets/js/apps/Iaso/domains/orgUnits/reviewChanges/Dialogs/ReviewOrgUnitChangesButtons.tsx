/* eslint-disable camelcase */
import { Box, Button } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import { NewOrgUnitField } from '../hooks/useNewFields';
import MESSAGES from '../messages';
import { OrgUnitChangeRequestDetails } from '../types';
import { ReviewOrgUnitChangesCommentDialog } from './ReviewOrgUnitChangesCommentDialog';

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

    const [isCommentDialogOpen, setIsCommentDialogOpen] =
        useState<boolean>(false);

    const [dialogTitleMessage, setDialogTitleMessage] = useState<string>('');

    const approvedFields: string[] = useMemo(() => {
        return isNewOrgUnit && changeRequest
            ? [...changeRequest.requested_fields]
            : selectedFields.map(field => `new_${field.key}`);
    }, [isNewOrgUnit, changeRequest, selectedFields]);

    const isPartiallyApproved = Boolean(
        changeRequest?.requested_fields &&
            changeRequest?.requested_fields.length > approvedFields.length &&
            approvedFields.length > 0,
    );
    const handleConfirm = useCallback(() => {
        if (isPartiallyApproved) {
            setIsCommentDialogOpen(true);
            setDialogTitleMessage(
                formatMessage(MESSAGES.addPartiallyApprovedComment),
            );
        } else {
            submitChangeRequest({
                status: 'approved',
                approved_fields: approvedFields,
            });
        }
    }, [
        isPartiallyApproved,
        formatMessage,
        submitChangeRequest,
        approvedFields,
    ]);

    const allowConfirm = isNewOrgUnit || selectedFields.length > 0;
    return (
        <>
            <ReviewOrgUnitChangesCommentDialog
                submitChangeRequest={submitChangeRequest}
                isCommentDialogOpen={isCommentDialogOpen}
                setIsCommentDialogOpen={setIsCommentDialogOpen}
                isPartiallyApproved={isPartiallyApproved}
                approvedFields={approvedFields}
                titleMessage={dialogTitleMessage}
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
                                onClick={() => {
                                    setDialogTitleMessage(
                                        formatMessage(
                                            MESSAGES.addRejectionComment,
                                        ),
                                    );
                                    setIsCommentDialogOpen(true);
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
