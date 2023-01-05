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
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';

import { Grid, Box, makeStyles } from '@material-ui/core';

import InputComponent from '../../../../components/forms/InputComponent';
import { EditIconButton } from '../ModalButtons';
import { MappingTable } from './MappingTable';

import { useGetForms } from '../../hooks/requests/useGetForms';
import { useUpdateWorkflowChange } from '../../hooks/requests/useUpdateWorkflowChange';
import { useCreateWorkflowChange } from '../../hooks/requests/useCreateWorkflowChange';

import MESSAGES from '../../messages';

import { Change, Mapping, ReferenceForm } from '../../types';
import { PossibleField } from '../../../forms/types/forms';
import { useGetPossibleFields } from '../../../forms/hooks/useGetPossibleFields';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    change?: Change;
    versionId: string;
    possibleFields: PossibleField[];
    referenceForm?: ReferenceForm;
};

const mapChange = (change?: Change): Mapping[] => {
    let mapArray: Mapping[] = [];
    if (change?.mapping) {
        mapArray = Object.entries(change.mapping).map(([key, value]) => ({
            target: key,
            source: value,
        }));
    }
    return mapArray;
};

const useStyles = makeStyles(theme => ({
    referenceForm: {
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        marginTop: 5,
        marginLeft: theme.spacing(2),
        '& span': {
            fontWeight: 'bold',
            paddingLeft: theme.spacing(4),
            paddingRight: theme.spacing(1),
        },
    },
}));

const Modal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    versionId,
    change,
    possibleFields,
    referenceForm,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [form, setForm] = useState<number | undefined>(change?.form?.id);
    const { mutate: saveChange } = useUpdateWorkflowChange();
    const { mutate: createChange } = useCreateWorkflowChange(
        closeDialog,
        versionId,
    );
    const { data: forms, isLoading: isLoadingForms } = useGetForms();

    const [mappingArray, setMappingArray] = useState<Mapping[]>(
        mapChange(change),
    );
    const handleConfirm = () => {
        const mappingObject = {};
        mappingArray.forEach(mapping => {
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

    const isValidMapping: boolean = useMemo(
        () =>
            mappingArray.filter(mapping =>
                sourcePossibleFields.some(
                    field => field.fieldKey === mapping.source,
                ),
            ).length === mappingArray.length,
        [mappingArray, sourcePossibleFields],
    );
    const allowConfirm =
        isValidMapping &&
        Boolean(form) &&
        mappingArray.length > 0 &&
        !mappingArray.find(mapping => !mapping.target || !mapping.source);
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
            maxWidth="lg"
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
                <Grid item xs={12} md={5}>
                    <InputComponent
                        type="select"
                        keyValue="forms"
                        onChange={(_, value) => setForm(value)}
                        value={form}
                        label={MESSAGES.sourceForm}
                        required
                        options={formsList}
                        loading={isLoadingForms}
                        clearable={false}
                    />
                </Grid>
                <Grid item xs={12} md={7}>
                    <Box className={classes.referenceForm}>
                        <ArrowRightAltIcon color="primary" fontSize="large" />
                        <span>{formatMessage(MESSAGES.targetForm)}:</span>{' '}
                        {referenceForm?.name}
                    </Box>
                </Grid>
                <Grid item xs={12}>
                    <MappingTable
                        mappingArray={mappingArray}
                        setMappingArray={setMappingArray}
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
