import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import MESSAGES from '../messages';

import { Chronogram } from '../../Chronogram/types';

import { DeleteIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { useDeleteChronogram } from '../api/useDeleteChronogram';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    chronogram: Chronogram;
};

const ChronogramDeleteModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    chronogram,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteChronogram } = useDeleteChronogram();
    const onDelete = useCallback(
        () => deleteChronogram(chronogram.id),
        [chronogram.id, deleteChronogram],
    );
    return (
        <ConfirmCancelModal
            open={isOpen}
            closeDialog={closeDialog}
            onClose={() => null}
            id="delete-notification"
            dataTestId="delete-notification"
            titleMessage={MESSAGES.modalDeleteTitle}
            onConfirm={onDelete}
            onCancel={() => null}
            confirmMessage={MESSAGES.yes}
            cancelMessage={MESSAGES.no}
        >
            <p>
                {formatMessage(MESSAGES.modalDeleteConfirm, {
                    campaignName: chronogram?.campaign_obr_name,
                    round_number: chronogram?.round_number,
                })}
            </p>
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(ChronogramDeleteModal, DeleteIconButton);

export { modalWithButton as DeleteChronogram };
