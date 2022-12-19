import React, { FunctionComponent, useState, useMemo } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    makeFullModal,
} from 'bluesquare-components';

import InputComponent from '../../../components/forms/InputComponent';
import { EditIconButton } from './ModalButtons';
import { commaSeparatedIdsToArray } from '../../../utils/forms';

import { useGetForms } from '../hooks/requests/useGetForms';

import MESSAGES from '../messages';

import { FollowUps } from '../types/workflows';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    followUp: FollowUps;
};

const FollowUpsModal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    followUp,
}) => {
    const { formatMessage } = useSafeIntl();
    const [formIds, setForms] = useState<number[]>(
        followUp.forms.map(form => form.id),
    );
    const handleConfirm = () => {
        return null;
    };
    const { data: forms, isLoading: isLoadingForms } = useGetForms();

    const formsList = useMemo(
        () =>
            forms?.map(form => ({
                label: form.name,
                value: form.id,
            })) || [],
        [forms],
    );
    const allowConfirm = formIds.length > 0;
    return (
        <ConfirmCancelModal
            allowConfirm={allowConfirm}
            titleMessage={formatMessage(MESSAGES.editFollowUp)}
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="xs"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="add-workflow-version"
            id="add-workflow-version"
            onClose={() => null}
        >
            <InputComponent
                type="select"
                keyValue="forms"
                onChange={(_, value) =>
                    setForms(commaSeparatedIdsToArray(value))
                }
                value={formIds.join(',')}
                label={MESSAGES.forms}
                required
                multi
                options={formsList}
                loading={isLoadingForms}
            />
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(FollowUpsModal, EditIconButton);

export { modalWithButton as FollowUpsModal };
