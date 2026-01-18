import React, { FunctionComponent } from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
} from 'bluesquare-components';

import { useUpdateStockRulesVersion } from 'Iaso/domains/stock/versions/hooks/requests';
import MESSAGES from '../../messages';
import { StockRulesVersion } from '../../types/stocks';
import { PublishButton, PublishIconButton } from './ModalButtons';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    version: StockRulesVersion;
};

const PublishVersionModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    version,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: updateWorkflowVersion } = useUpdateStockRulesVersion();
    const handleConfirm = () => {
        updateWorkflowVersion({ id: version.id, status: 'PUBLISHED' });
    };

    return (
        <ConfirmCancelModal
            allowConfirm
            titleMessage={`${formatMessage(MESSAGES.publish)} ${
                version.name
            } ?`}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="publish-workflow-version"
            id="publish-workflow-version"
            onClose={() => null}
        >
            {formatMessage(MESSAGES.deleteText)}
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(PublishVersionModal, PublishButton);
const modalWithIcon = makeFullModal(PublishVersionModal, PublishIconButton);

export {
    modalWithButton as PublishVersionModal,
    modalWithIcon as PublishVersionIconModal,
};
