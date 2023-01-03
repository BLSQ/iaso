import React, { FunctionComponent, useState, useMemo } from 'react';

import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    ConfirmCancelModal,
    // @ts-ignore
    makeFullModal,
    // @ts-ignore
    AddButton,
} from 'bluesquare-components';

import { Grid } from '@material-ui/core';
import InputComponent from '../../../../components/forms/InputComponent';
import { EditIconButton } from '../ModalButtons';

import { useGetForms } from '../../hooks/requests/useGetForms';
import { useUpdateWorkflowChange } from '../../hooks/requests/useUpdateWorkflowChange';
import { useCreateWorkflowChange } from '../../hooks/requests/useCreateWorkflowChange';

import MESSAGES from '../../messages';

import { Change } from '../../types';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    change?: Change;
    versionId: string;
};

const Modal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    versionId,
    change,
}) => {
    const { formatMessage } = useSafeIntl();
    const [form, setForm] = useState<number | undefined>(change?.form?.id);
    const { mutate: saveChange } = useUpdateWorkflowChange();
    const { mutate: createChange } = useCreateWorkflowChange(
        closeDialog,
        versionId,
    );
    const { data: forms, isLoading: isLoadingForms } = useGetForms();

    const handleConfirm = () => {
        if (change?.id) {
            saveChange({
                id: change.id,
                form,
            });
        } else {
            createChange({
                form,
            });
        }
    };
    const formsList = useMemo(
        () =>
            forms?.map(f => ({
                label: f.name,
                value: f.id,
            })) || [],
        [forms],
    );
    const allowConfirm = Boolean(form);
    return (
        <ConfirmCancelModal
            allowConfirm={allowConfirm}
            titleMessage={
                change?.id
                    ? formatMessage(MESSAGES.editChange)
                    : formatMessage(MESSAGES.createChange)
            }
            onConfirm={handleConfirm}
            onCancel={() => {
                closeDialog();
            }}
            maxWidth="md"
            cancelMessage={MESSAGES.cancel}
            confirmMessage={MESSAGES.confirm}
            open={isOpen}
            closeDialog={closeDialog}
            dataTestId="workflow-change"
            id="workflow-change"
            onClose={() => null}
        >
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <InputComponent
                        type="select"
                        keyValue="forms"
                        onChange={(_, value) => setForm(value)}
                        value={form}
                        label={MESSAGES.form}
                        required
                        options={formsList}
                        loading={isLoadingForms}
                    />
                </Grid>
                <Grid item xs={12} md={4} />
            </Grid>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(Modal, EditIconButton);
const AddModalWithButton = makeFullModal(Modal, AddButton);

export {
    modalWithButton as ChangesModal,
    AddModalWithButton as AddChangeModal,
};
