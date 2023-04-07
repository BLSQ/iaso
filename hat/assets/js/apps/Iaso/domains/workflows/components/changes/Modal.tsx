import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
    useEffect,
} from 'react';

import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
    LoadingSpinner,
} from 'bluesquare-components';
import ArrowRightAltIcon from '@material-ui/icons/ArrowRightAlt';
import uniqWith from 'lodash/uniqWith';
import isEqual from 'lodash/isEqual';

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
import {
    FormVersion,
    useGetPossibleFieldsByFormVersion,
} from '../../../forms/hooks/useGetPossibleFields';
import { DropdownOptions } from '../../../../types/utils';

type Props = {
    isOpen: boolean;
    closeDialog: () => void;
    change?: Change;
    versionId: string;
    targetPossibleFields?: PossibleField[];
    targetPossibleFieldsByVersion?: FormVersion[];
    referenceForm?: ReferenceForm;
    changes?: Change[];
};

const mapChange = (change?: Change): Mapping[] => {
    let mapArray: Mapping[] = [];
    if (change?.mapping) {
        mapArray = Object.entries(change.mapping).map(([key, value]) => ({
            target: value,
            source: key,
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
    targetPossibleFieldsByVersion,
    referenceForm,
    changes,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const [form, setForm] = useState<number | undefined>(change?.form?.id);
    const [targetVersion, setTargetVersion] = useState<string>('all');
    const [selectedTargetPossibleFields, setSelectedTargetPossibleFields] =
        useState<PossibleField[] | undefined>(targetPossibleFields);

    const [sourceVersion, setSourceVersion] = useState<string>('all');
    const [selectedSourcePossibleFields, setSelectedSourcePossibleFields] =
        useState<PossibleField[] | undefined>();

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
                mappingObject[mapping.source] = mapping.target;
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
        formVersions: sourcePossibleFieldsByVersion,
        isFetchingForm: isFetchingSourcePossibleFields,
    } = useGetPossibleFieldsByFormVersion(form);
    const sourcePossibleFields: PossibleField[] = useMemo(() => {
        if (!sourcePossibleFieldsByVersion) return [];
        return uniqWith(
            sourcePossibleFieldsByVersion.flatMap(
                formVersion => formVersion.possible_fields,
            ),
            isEqual,
        );
    }, [sourcePossibleFieldsByVersion]);
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

    const sourceVersionsDropdownOptions: DropdownOptions<string>[] =
        useMemo(() => {
            const options =
                sourcePossibleFieldsByVersion?.map(version => ({
                    label: version.version_id,
                    value: version.version_id,
                })) || [];
            options.unshift({
                label: formatMessage(MESSAGES.allVersions),
                value: 'all',
            });
            return options;
        }, [formatMessage, sourcePossibleFieldsByVersion]);
    const targetVersionsDropdownOptions: DropdownOptions<string>[] =
        useMemo(() => {
            const options =
                targetPossibleFieldsByVersion?.map(version => ({
                    label: version.version_id,
                    value: version.version_id,
                })) || [];
            options.unshift({
                label: formatMessage(MESSAGES.allVersions),
                value: 'all',
            });
            return options;
        }, [formatMessage, targetPossibleFieldsByVersion]);

    const handleChangeTargetVersion = useCallback(
        (_, value) => {
            if (value !== 'all') {
                setSelectedTargetPossibleFields(
                    targetPossibleFieldsByVersion?.find(
                        version => version.version_id === value,
                    )?.possible_fields || [],
                );
            } else {
                setSelectedTargetPossibleFields(targetPossibleFields);
            }
            setTargetVersion(value);
        },
        [targetPossibleFields, targetPossibleFieldsByVersion],
    );
    const handleChangeSourceVersion = useCallback(
        (_, value) => {
            if (value !== 'all') {
                setSelectedSourcePossibleFields(
                    sourcePossibleFieldsByVersion?.find(
                        version => version.version_id === value,
                    )?.possible_fields || [],
                );
            } else {
                setSelectedSourcePossibleFields(sourcePossibleFields);
            }
            setSourceVersion(value);
        },
        [sourcePossibleFields, sourcePossibleFieldsByVersion],
    );

    useEffect(() => {
        if (
            (selectedSourcePossibleFields?.length === 0 ||
                !selectedSourcePossibleFields) &&
            sourcePossibleFields.length > 0
        ) {
            setSelectedSourcePossibleFields(sourcePossibleFields);
        }
    }, [selectedSourcePossibleFields, sourcePossibleFields]);
    console.log('selectedSourcePossibleFields', selectedSourcePossibleFields);
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
            <Box position="relative" data-test="change-modal">
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
                            <ArrowRightAltIcon
                                color="primary"
                                fontSize="large"
                            />
                            <span>{formatMessage(MESSAGES.targetForm)}:</span>{' '}
                            {referenceForm?.name}
                        </Box>
                    </Grid>

                    <Grid item xs={12} container spacing={0}>
                        <Grid item md={1} />
                        <Grid item xs={12} md={4}>
                            <InputComponent
                                type="select"
                                keyValue="sourceVersion"
                                onChange={handleChangeSourceVersion}
                                value={sourceVersion}
                                label={MESSAGES.sourceVersion}
                                options={sourceVersionsDropdownOptions}
                                clearable={false}
                            />
                        </Grid>
                        <Grid item md={1} />
                        <Grid item xs={12} md={4}>
                            <InputComponent
                                type="select"
                                keyValue="targetVersion"
                                onChange={handleChangeTargetVersion}
                                value={targetVersion}
                                label={MESSAGES.targetVersion}
                                options={targetVersionsDropdownOptions}
                                clearable={false}
                            />
                        </Grid>
                        <Grid item md={2} />
                    </Grid>
                    <Grid item xs={12}>
                        <MappingTable
                            setIsTouched={setIsTouched}
                            mappingArray={mappingArray}
                            setMappingArray={setMappingArray}
                            sourcePossibleFields={
                                selectedSourcePossibleFields || []
                            }
                            targetPossibleFields={
                                selectedTargetPossibleFields || []
                            }
                            isFetchingSourcePossibleFields={
                                isFetchingSourcePossibleFields
                            }
                            form={form}
                        />
                    </Grid>
                </Grid>
            </Box>
        </ConfirmCancelModal>
    );
};
const modalWithButton = makeFullModal(Modal, EditIconButton);
const AddModalWithButton = makeFullModal(Modal, AddButton);

export {
    modalWithButton as ChangesModal,
    AddModalWithButton as AddChangeModal,
};
