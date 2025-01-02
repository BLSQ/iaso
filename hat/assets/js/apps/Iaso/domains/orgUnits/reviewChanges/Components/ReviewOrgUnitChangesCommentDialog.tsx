import { SimpleModal } from 'bluesquare-components';
import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useMemo,
    useState,
} from 'react';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import { ReviewOrgUnitChangesCommentDialogButtons } from './ReviewOrgUnitChangesCommentDialogButtons';
import InputComponent from '../../../../components/forms/InputComponent';

type SubmitChangeRequest = (variables: UseSaveChangeRequestQueryData) => void;

type Props = {
    submitChangeRequest: SubmitChangeRequest;
    isCommentDialogOpen: boolean;
    setIsCommentDialogOpen: Dispatch<SetStateAction<boolean>>;
    isPartiallyApproved: boolean;
    approvedFields: string[];
    titleMessage: string;
};

const createChangesCommentDialogButtons = props => {
    const {
        comment,
        setIsCommentDialogOpen,
        submitChangeRequest,
        isPartiallyApproved,
        approvedFields,
    } = props;
    return (
        <ReviewOrgUnitChangesCommentDialogButtons
            comment={comment}
            setIsCommentDialogOpen={setIsCommentDialogOpen}
            submitChangeRequest={submitChangeRequest}
            isPartiallyApproved={isPartiallyApproved}
            approvedFields={approvedFields}
        />
    );
};

export const ReviewOrgUnitChangesCommentDialog: FunctionComponent<Props> = ({
    submitChangeRequest,
    isCommentDialogOpen,
    setIsCommentDialogOpen,
    isPartiallyApproved,
    approvedFields,
    titleMessage,
}) => {
    const [comment, setComment] = useState<string | undefined>();

    const reviewOrgUnitChangesCommentDialogButtons = useMemo(() => {
        return createChangesCommentDialogButtons({
            comment,
            setIsCommentDialogOpen,
            submitChangeRequest,
            isPartiallyApproved,
            approvedFields,
        });
    }, [
        approvedFields,
        comment,
        isPartiallyApproved,
        setIsCommentDialogOpen,
        submitChangeRequest,
    ]);
    return (
        <SimpleModal
            open={isCommentDialogOpen}
            maxWidth="xs"
            onClose={() => null}
            id="approve-orgunit-comment-changes-dialog"
            dataTestId="approve-orgunit-comment-changes-dialog"
            titleMessage={titleMessage}
            closeDialog={() => setIsCommentDialogOpen(false)}
            buttons={() => reviewOrgUnitChangesCommentDialogButtons}
        >
            <InputComponent
                type="textarea"
                keyValue=""
                value={comment}
                onChange={(_, newComment) => setComment(newComment)}
                debounceTime={0}
                withMarginTop={false}
            />
        </SimpleModal>
    );
};
