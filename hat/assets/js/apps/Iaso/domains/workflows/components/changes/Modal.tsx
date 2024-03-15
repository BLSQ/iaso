import React, {
    FunctionComponent,
    useState,
    useMemo,
    useCallback,
    useEffect,
} from 'react';
import { orderBy } from 'lodash';
import {
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    AddButton,
    LoadingSpinner,
} from 'bluesquare-components';
import uniqWith from 'lodash/uniqWith';
import isEqual from 'lodash/isEqual';

import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { MappingTable } from './MappingTable';
import { Popper } from './InfoPopper';

import { useSaveWorkflowChange } from '../../hooks/requests/useSaveWorkflowChange';

import MESSAGES from '../../messages';

import { Change, Mapping, ReferenceForm } from '../../types';
import { PossibleField } from '../../../forms/types/forms';
import {
    FormVersion,
    useGetPossibleFieldsByFormVersion,
} from '../../../forms/hooks/useGetPossibleFields';
import { DropdownOptions } from '../../../../types/utils';
import { EditIconButton } from '../../../../components/Buttons/EditIconButton';

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

const useStyles = makeStyles(() => ({
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
        mappingArray.length > 0 &&
        !mappingArray.find(mapping => !mapping.target || !mapping.source);

    const getVersionDropdownOptions = useCallback(
        (versions: FormVersion[]): DropdownOptions<string>[] => {
            const options =
                orderBy(
                    versions,
                    [version => version.created_at],
                    ['desc'],
                ).map((version, index) => ({
                    label: `${version.version_id}${
                        index === 0
                            ? ` (${formatMessage(MESSAGES.latest)})`
                            : ''
                    }`,
                    value: version.version_id,
                })) || [];
            options.unshift({
                label: formatMessage(MESSAGES.allVersions),
                value: 'all',
            });
            return options;
        },
        [formatMessage],
    );

    const sourceVersionsDropdownOptions: DropdownOptions<string>[] = useMemo(
        () => getVersionDropdownOptions(sourcePossibleFieldsByVersion || []),
        [getVersionDropdownOptions, sourcePossibleFieldsByVersion],
    );
    const targetVersionsDropdownOptions: DropdownOptions<string>[] = useMemo(
        () => getVersionDropdownOptions(targetPossibleFieldsByVersion || []),
        [getVersionDropdownOptions, targetPossibleFieldsByVersion],
    );

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
                <MappingTable
                    setIsTouched={setIsTouched}
                    mappingArray={mappingArray}
                    setMappingArray={setMappingArray}
                    sourcePossibleFields={selectedSourcePossibleFields || []}
                    targetPossibleFields={selectedTargetPossibleFields || []}
                    isFetchingSourcePossibleFields={
                        isFetchingSourcePossibleFields
                    }
                    handleChangeForm={handleChangeForm}
                    changes={changes}
                    change={change}
                    form={form}
                    handleChangeSourceVersion={handleChangeSourceVersion}
                    sourceVersion={sourceVersion}
                    sourceVersionsDropdownOptions={
                        sourceVersionsDropdownOptions
                    }
                    handleChangeTargetVersion={handleChangeTargetVersion}
                    targetVersion={targetVersion}
                    targetVersionsDropdownOptions={
                        targetVersionsDropdownOptions
                    }
                    referenceForm={referenceForm}
                />
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
