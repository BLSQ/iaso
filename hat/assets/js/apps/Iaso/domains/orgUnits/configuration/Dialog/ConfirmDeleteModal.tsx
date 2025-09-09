import React, { FunctionComponent, useCallback } from 'react';

import {
    ConfirmCancelModal,
    makeFullModal,
    useSafeIntl,
} from 'bluesquare-components';

import { DeleteIconButton } from '../../../../components/Buttons/DeleteIconButton';
import { useDeleteOrgUnitChangeRequestConfig } from '../hooks/api/useDeleteOrgUnitChangeRequestConfig';
import MESSAGES from '../messages';
import { OrgUnitChangeRequestConfigurationFull } from '../types';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    config: OrgUnitChangeRequestConfigurationFull;
};

const ConfirmDeleteModal: FunctionComponent<Props> = ({
    isOpen,
    closeDialog,
    config,
}) => {
    const { formatMessage } = useSafeIntl();
    const { mutate: deleteConfig } = useDeleteOrgUnitChangeRequestConfig();
    const onDelete = useCallback(
        () => deleteConfig(config),
        [config, deleteConfig],
    );
    return (
        <ConfirmCancelModal
            open={isOpen}
            closeDialog={closeDialog}
            onClose={() => null}
            id="delete-notification"
            dataTestId="delete-notification"
            titleMessage={{
                ...MESSAGES.confirmSuppression,
                values: {
                    project: config.project.name,
                    orgUnitType: config.org_unit_type.name,
                },
            }}
            onConfirm={onDelete}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
        >
            <p>{formatMessage(MESSAGES.deleteCannotBeUndone)}</p>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(ConfirmDeleteModal, DeleteIconButton);
export { modalWithButton as ConfirmDeleteModal };
