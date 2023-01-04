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
    // @ts-ignore
    LoadingSpinner,
} from 'bluesquare-components';

import { Grid } from '@material-ui/core';
import InputComponent from '../../../../components/forms/InputComponent';
import { EditIconButton } from '../ModalButtons';
import { MappingTable } from './MappingTable';

import { useGetForms } from '../../hooks/requests/useGetForms';
import { useUpdateWorkflowChange } from '../../hooks/requests/useUpdateWorkflowChange';
import { useCreateWorkflowChange } from '../../hooks/requests/useCreateWorkflowChange';

import MESSAGES from '../../messages';

import { Change, Mapping } from '../../types';
import { PossibleField } from '../../../forms/types/forms';
import { useGetPossibleFields } from '../../../forms/hooks/useGetPossibleFields';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    change?: Change;
    versionId: string;
    possibleFields: PossibleField[];
};

const Modal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    versionId,
    change,
    possibleFields,
}) => {
    const { formatMessage } = useSafeIntl();
    const [form, setForm] = useState<number | undefined>(change?.form?.id);
    const { mutate: saveChange } = useUpdateWorkflowChange();
    const { mutate: createChange } = useCreateWorkflowChange(
        closeDialog,
        versionId,
    );
    const { data: forms, isLoading: isLoadingForms } = useGetForms();

    const mappedChange = useMemo(
        () =>
            change?.mapping
                ? Object.entries(change.mapping).map(([key, value]) => ({
                      target: key,
                      source: value,
                  }))
                : [],
        [change],
    );
    const [mappings, setMappings] = useState<Mapping[]>(mappedChange);
    const handleConfirm = () => {
        const mappingObject = {};
        mappings.forEach(mapping => {
            if (mapping.target && mapping.source) {
                mappingObject[mapping.target] = mapping.source;
            }
        });
        if (change?.id) {
            saveChange({
                id: change.id,
                form,
                mapping: mappingObject,
            });
        } else {
            createChange({
                form,
                mapping: mappingObject,
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
    const {
        possibleFields: sourcePossibleFields,
        isFetchingForm: isFetchingSourcePossibleFields,
    } = useGetPossibleFields(form);

    const allowConfirm =
        Boolean(form) &&
        mappings.length > 0 &&
        !mappings.find(mapping => !mapping.target || !mapping.source);
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
            {isFetchingSourcePossibleFields && <LoadingSpinner absolute />}
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
                <Grid item xs={12}>
                    <MappingTable
                        mappings={mappings}
                        setMappings={setMappings}
                        sourcePossibleFields={sourcePossibleFields}
                        targetPossibleFields={possibleFields}
                        isFetchingSourcePossibleFields={
                            isFetchingSourcePossibleFields
                        }
                        form={form}
                    />
                </Grid>
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
