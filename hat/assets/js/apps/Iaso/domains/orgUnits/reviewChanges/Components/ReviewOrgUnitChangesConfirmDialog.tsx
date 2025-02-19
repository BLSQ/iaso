import React, { FunctionComponent, useMemo, useState } from 'react';
import { SimpleModal, useSafeIntl } from 'bluesquare-components';
import InputComponent from '../../../../components/forms/InputComponent';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import MESSAGES from '../messages';
import { ReviewOrgUnitChangesConfirmDialogButtons } from './ReviewOrgUnitChangesConfirmDialogButtons';

type SubmitChangeRequest = (variables: UseSaveChangeRequestQueryData) => void;

type ButtonProps = {
    comment?: string;
    onClose: () => void;
    submitChangeRequest: SubmitChangeRequest;
    isApproved: boolean;
    isPartiallyApproved: boolean;
    approvedFields: string[];
};

const createChangesConfirmDialogButtons: FunctionComponent<ButtonProps> = ({
    comment,
    onClose,
    submitChangeRequest,
    isApproved,
    isPartiallyApproved,
    approvedFields,
}) => {
    return (
        <ReviewOrgUnitChangesConfirmDialogButtons
            comment={comment}
            onClose={onClose}
            submitChangeRequest={submitChangeRequest}
            isApproved={isApproved}
            isPartiallyApproved={isPartiallyApproved}
            approvedFields={approvedFields}
        />
    );
};

type Props = {
    submitChangeRequest: SubmitChangeRequest;
    open: boolean;
    onClose: () => void;
    isApproved: boolean;
    isPartiallyApproved: boolean;
    approvedFields: string[];
};

export const ReviewOrgUnitChangesConfirmDialog: FunctionComponent<Props> = ({
    submitChangeRequest,
    open,
    onClose,
    isApproved,
    isPartiallyApproved,
    approvedFields,
}) => {
    const [comment, setComment] = useState<string | undefined>();
    const { formatMessage } = useSafeIntl();
    const titleMessage = useMemo(() => {
        if (isPartiallyApproved) {
            return formatMessage(MESSAGES.addPartiallyApprovedComment);
        }
        if (isApproved) {
            return '';
        }
        return formatMessage(MESSAGES.addRejectionComment);
    }, [isApproved, isPartiallyApproved, formatMessage]);

    const reviewOrgUnitChangesCommentDialogButtons = useMemo(() => {
        return createChangesConfirmDialogButtons({
            comment,
            onClose,
            submitChangeRequest,
            isApproved,
            isPartiallyApproved,
            approvedFields,
        });
    }, [
        approvedFields,
        comment,
        onClose,
        isApproved,
        isPartiallyApproved,
        submitChangeRequest,
    ]);
    return (
        <SimpleModal
            open={open}
            maxWidth="xs"
            onClose={() => null}
            id="approve-orgunit-comment-changes-dialog"
            dataTestId="approve-orgunit-comment-changes-dialog"
            titleMessage={titleMessage}
            closeDialog={onClose}
            buttons={() => reviewOrgUnitChangesCommentDialogButtons}
        >
            {(!isApproved || isPartiallyApproved) && (
                <InputComponent
                    type="textarea"
                    keyValue=""
                    value={comment}
                    onChange={(_, newComment) => setComment(newComment)}
                    debounceTime={0}
                    withMarginTop={false}
                />
            )}
            {isApproved && !isPartiallyApproved && (
                <>
                    <p>{formatMessage(MESSAGES.confirmAcceptChangeRequest)}</p>
                    <p>{formatMessage(MESSAGES.confirmMessage)}</p>
                </>
            )}
        </SimpleModal>
    );
};
