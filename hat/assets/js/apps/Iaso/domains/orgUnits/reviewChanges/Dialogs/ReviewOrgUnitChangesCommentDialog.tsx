/* eslint-disable camelcase */
import { SimpleModal, useSafeIntl } from 'bluesquare-components';
import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useState,
} from 'react';
import { TextArea } from '../../../../components/forms/TextArea';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import MESSAGES from '../messages';
import { ReviewOrgUnitChangesCommentDialogButtons } from './ReviewOrgUnitChangesCommentDialogButtons';

type SubmitChangeRequest = (
    // eslint-disable-next-line no-unused-vars
    variables: UseSaveChangeRequestQueryData,
) => void;

type Props = {
    submitChangeRequest: SubmitChangeRequest;
    isCommentDialogOpen: boolean;
    setIsCommentDialogOpen: Dispatch<SetStateAction<boolean>>;
    isPartiallyApproved: boolean;
    approvedFields: string[];
};

export const ReviewOrgUnitChangesCommentDialog: FunctionComponent<Props> = ({
    submitChangeRequest,
    isCommentDialogOpen,
    setIsCommentDialogOpen,
    isPartiallyApproved,
    approvedFields,
}) => {
    const { formatMessage } = useSafeIntl();
    const [comment, setComment] = useState<string | undefined>();
    return (
        <SimpleModal
            open={isCommentDialogOpen}
            maxWidth="xs"
            onClose={() => null}
            id="approve-orgunit-comment-changes-dialog"
            dataTestId="approve-orgunit-comment-changes-dialog"
            titleMessage={formatMessage(MESSAGES.addComment)}
            closeDialog={() => setIsCommentDialogOpen(false)}
            buttons={() => (
                <ReviewOrgUnitChangesCommentDialogButtons
                    comment={comment}
                    setIsCommentDialogOpen={setIsCommentDialogOpen}
                    submitChangeRequest={submitChangeRequest}
                    isPartiallyApproved={isPartiallyApproved}
                    approvedFields={approvedFields}
                />
            )}
        >
            <TextArea
                label=""
                value={comment}
                onChange={newComment => setComment(newComment)}
                debounceTime={0}
            />
        </SimpleModal>
    );
};
