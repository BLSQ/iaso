import React, { FunctionComponent, useCallback } from 'react';
import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import { DeleteIconButton } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';
import { useDeletePerformance } from '../hooks/api';
import MESSAGES from '../messages';
import { PerformanceData } from '../types';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    performanceData: PerformanceData;
};

const DeletePerformanceModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    performanceData,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: deletePerformance } = useDeletePerformance();
    const onDelete = useCallback(
        () => deletePerformance(performanceData.id),
        [performanceData.id, deletePerformance],
    );
    const recordName = `${performanceData.country_name} - ${performanceData.date}`;
    return (
        <ConfirmCancelModal
            open={isOpen}
            closeDialog={closeDialog}
            onClose={() => null}
            id="delete-performance"
            dataTestId="delete-performance"
            titleMessage={formatMessage(MESSAGES.deletePerformance, {
                name: recordName,
            })}
            onConfirm={onDelete}
            onCancel={() => null}
            confirmMessage={MESSAGES.yes}
            cancelMessage={MESSAGES.no}
        ></ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(DeletePerformanceModal, DeleteIconButton);

export { modalWithButton as DeletePerformanceModal };
