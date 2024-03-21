import React, { FunctionComponent, useCallback } from 'react';
import { ConfirmCancelModal, makeFullModal } from 'bluesquare-components';

import { DeleteIconButton } from '../../../../../../../hat/assets/js/apps/Iaso/components/Buttons/DeleteIconButton';

import MESSAGES from '../messages';
import { Budget } from '../types';
import { formatRoundNumbers } from '../utils';
import { useDeleteBudgetProcess } from '../hooks/api/useDeleteBudgetProcess';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    budgetProcess: Budget;
};

const DeleteBudgetProcessModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    budgetProcess,
}) => {
    const { mutate: deleteBudgetProcess } = useDeleteBudgetProcess();
    const onDelete = useCallback(
        () => deleteBudgetProcess(budgetProcess.id),
        [budgetProcess.id, deleteBudgetProcess],
    );
    return (
        <ConfirmCancelModal
            open={isOpen}
            closeDialog={closeDialog}
            onClose={() => null}
            id="delete-budget-process"
            dataTestId="delete-budget-process"
            titleMessage={MESSAGES.modalConfirmDeleteBudgetProcess}
            onConfirm={onDelete}
            onCancel={() => null}
            confirmMessage={MESSAGES.modalDeleteYes}
            cancelMessage={MESSAGES.modalDeleteNo}
        >
            <ul>
                <li>{budgetProcess.obr_name}</li>
                <li>{formatRoundNumbers(budgetProcess.round_numbers!)}</li>
            </ul>
        </ConfirmCancelModal>
    );
};

const modalWithButton = makeFullModal(
    DeleteBudgetProcessModal,
    DeleteIconButton,
);

export { modalWithButton as DeleteBudgetProcessModal };
