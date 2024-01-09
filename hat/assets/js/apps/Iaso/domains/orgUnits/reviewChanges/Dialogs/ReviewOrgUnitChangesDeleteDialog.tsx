/* eslint-disable camelcase */
import React, {
    FunctionComponent,
    useState,
    SetStateAction,
    Dispatch,
} from 'react';
import { SimpleModal, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { UseSaveChangeRequestQueryData } from '../hooks/api/useSaveChangeRequest';
import { TextArea } from '../../../../components/forms/TextArea';
import { ReviewOrgUnitChangesDeleteButtons } from './ReviewOrgUnitChangesDeleteButtons';

type SubmitChangeRequest = (
    // eslint-disable-next-line no-unused-vars
    variables: UseSaveChangeRequestQueryData,
) => void;

type Props = {
    submitChangeRequest: SubmitChangeRequest;
    isRejectDialogOpen: boolean;
    setIsRejectDialogOpen: Dispatch<SetStateAction<boolean>>;
};

export const ReviewOrgUnitChangesDeleteDialog: FunctionComponent<Props> = ({
    submitChangeRequest,
    isRejectDialogOpen,
    setIsRejectDialogOpen,
}) => {
    const { formatMessage } = useSafeIntl();
    const [rejectedReason, setRejectedReason] = useState<string | undefined>();
    return (
        <SimpleModal
            open={isRejectDialogOpen}
            maxWidth="xs"
            onClose={() => null}
            id="approve-orgunit-reject-changes-dialog"
            dataTestId="approve-orgunit-reject-changes-dialog"
            titleMessage={formatMessage(MESSAGES.addComment)}
            closeDialog={() => setIsRejectDialogOpen(false)}
            buttons={() => (
                <ReviewOrgUnitChangesDeleteButtons
                    rejectedReason={rejectedReason}
                    setIsRejectDialogOpen={setIsRejectDialogOpen}
                    submitChangeRequest={submitChangeRequest}
                />
            )}
        >
            <TextArea
                label=""
                value={rejectedReason}
                onChange={newReason => setRejectedReason(newReason)}
                debounceTime={0}
            />
        </SimpleModal>
    );
};
