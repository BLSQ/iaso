import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
} from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
    LoadingSpinner,
} from 'bluesquare-components';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';

import { Grid, Box, makeStyles } from '@material-ui/core';

import InputComponent from '../../../../components/forms/InputComponent';
import { EditIconButton } from '../ModalButtons';
import { MappingTable } from './MappingTable';
import { Popper } from './InfoPopper';

import { useGetForms } from '../../hooks/requests/useGetForms';
import { useSaveWorkflowChange } from '../../hooks/requests/useSaveWorkflowChange';

import MESSAGES from '../../messages';

import { Change, Mapping, ReferenceForm } from '../../types';
import { PossibleField } from '../../../forms/types/forms';
import { useGetPossibleFields } from '../../../forms/hooks/useGetPossibleFields';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    change?: Change;
    versionId: string;
    targetPossibleFields: PossibleField[];
    referenceForm?: ReferenceForm;
    changes?: Change[];
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
    popper: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
}));

// - Source and target should be of the same type
// - Cannot have multiple mappings on the same source or target

const Modal: FunctionComponent<Props> = ({
    closeDialog,
    isOpen,
    versionId,
    change,
    targetPossibleFields,
    referenceForm,
    changes,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [form, setForm] = useState<number | undefined>(change?.form?.id);
    const [isTouched, setIsTouched] = useState<boolean>(false);
    const { mutate: saveChange } = useSaveWorkflowChange(
        closeDialog,
        versionId,
    );

    const { data: forms, isLoading: isLoadingForms } = useGetForms();

    const [mappingArray, setMappingArray] = useState<Mapping[]>(
        mapChange(change),
    );
    const handleConfirm = useCallback(() => {
        const mappingObject = {};
        mappingArray.forEach(mapping => {
            if (mapping.target && mapping.source) {
                mappingObject[mapping.target] = mapping.source;
            }
        });
        saveChange({
            id: change?.id,
            form,
            mapping: mappingObject,
        });
    }, [change?.id, form, mappingArray, saveChange]);

    const handleChangeForm = useCallback(
        (_, value) => {
            const newMappings = mappingArray.map(mapping => ({
                ...mapping,
                source: undefined,
            }));
            setMappingArray(newMappings);
            setForm(value);
        },
        [mappingArray],
    );
    const formsList = useMemo(
        () =>
            forms
                // remove already selected forms
                ?.filter(
                    f =>
                        !changes?.find(ch => ch.form.id === f.id) ||
                        change?.form.id === f.id,
                )
                .map(f => ({
                    label: f.name,
                    value: f.id,
                })) || [],
        [change?.form.id, changes, forms],
    );

    const {
        possibleFields: sourcePossibleFields,
        isFetchingForm: isFetchingSourcePossibleFields,
    } = useGetPossibleFields(form);

    const isValidMapping: boolean =
        mappingArray.filter(mapping =>
            sourcePossibleFields.some(
                field => field.fieldKey === mapping.source,
            ),
        ).length === mappingArray.length;

    const allowConfirm =
        isTouched &&
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
            closeDialog={() => null}
            dataTestId="workflow-change"
            id="workflow-change"
            onClose={() => null}
        >
            <Box className={classes.popper}>
                <Popper />
            </Box>

            {isFetchingSourcePossibleFields && <LoadingSpinner absolute />}
            <Grid container spacing={2}>
                <Grid item xs={12} md={5}>
                    <InputComponent
                        type="select"
                        keyValue="forms"
                        onChange={handleChangeForm}
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
                        setIsTouched={setIsTouched}
                        mappingArray={mappingArray}
                        setMappingArray={setMappingArray}
                        sourcePossibleFields={sourcePossibleFields}
                        targetPossibleFields={targetPossibleFields}
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
