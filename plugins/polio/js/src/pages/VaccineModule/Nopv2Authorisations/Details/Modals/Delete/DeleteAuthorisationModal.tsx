import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';
import MESSAGES from './MESSAGES';
import { useDeleteNopv2Authorisation } from '../../../hooks/api';
import { EditIconButton } from '../../../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/EditIconButton';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    authorisationId: number;
};

const DeleteAuthorisationModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    authorisationId,
}) => {
    const testId = 'delete-nopv2-auth';
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteAuth } = useDeleteNopv2Authorisation();
    const onConfirm = useCallback(
        () => deleteAuth(authorisationId),
        [authorisationId, deleteAuth],
    );
    return (
        <ConfirmCancelModal
            open={isOpen}
            closeDialog={closeDialog}
            onClose={() => null}
            id={testId}
            dataTestId={testId}
            titleMessage={MESSAGES.deleteNopv2Auth}
            onConfirm={onConfirm}
            onCancel={() => null}
            confirmMessage={MESSAGES.yes}
            cancelMessage={MESSAGES.no}
        >
            {formatMessage(MESSAGES.confirmDeleteNopv2Auth)}
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(DeleteAuthorisationModal, EditIconButton);

export { modalWithButton as DeleteAuthorisationModal };
