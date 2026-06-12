import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Stack, Typography } from '@mui/material';
import {
    ConfirmCancelModal,
    IntlMessage,
    useSafeIntl,
    useSkipEffectOnMount,
    InputWithInfos,
    makeFullModal,
    AddButton,
} from 'bluesquare-components';
import { isUndefined, mapValues } from 'lodash';
import intersection from 'lodash/intersection';
import isEmpty from 'lodash/isEmpty';

import {
    OrgUnitTypeRetrieve,
    useApiV2OrgunittypesCreate,
    useApiV2OrgunittypesPartialUpdate,
    useApiV2OrgunittypesRetrieve,
} from 'Iaso/api/orgUnitTypes';
import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useFormState } from 'Iaso/hooks/form';
import { DropdownOptions } from 'Iaso/types/utils';
import {
    commaSeparatedIdsToArray,
    isFieldValid,
    isFormValid,
} from 'Iaso/utils/forms';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import InputComponent from '../../../../components/forms/InputComponent';
import * as Permission from '../../../../utils/permissions';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import {
    userHasOneOfPermissions,
    userHasPermission,
} from '../../../users/utils';
import { OrgunitType } from '../../types/orgunitTypes';
import { requiredFields } from '../config/requiredFields';
import { useGetOrgUnitTypesDropdownOptions } from '../hooks/useGetOrgUnitTypesDropdownOptions';
import MESSAGES from '../messages';

type FormDropdownOption = {
    value: number;
    label: string;
    original: {
        id: number;
        name: string;
        projects: {
            id: number;
            name: string;
        }[];
    };
};

const styles = {
    warningMessage: theme => ({
        padding: '5px',
        color: theme.palette.warning.main,
    }),
};
const mapOrgUnitType = (
    orgUnitType: OrgUnitTypeRetrieve | typeof defaultOrgUnitType,
) => {
    return {
        id: orgUnitType.id,
        name: orgUnitType.name,
        short_name: orgUnitType.short_name,
        project_ids: orgUnitType.projects.map(project => project.id),
        depth: orgUnitType.depth,
        sub_unit_type_ids: orgUnitType.sub_unit_types.map(unit => unit.id),
        allow_creating_sub_unit_type_ids:
            orgUnitType.allow_creating_sub_unit_types.map(unit => unit.id),
        reference_forms_ids: orgUnitType.reference_forms.map(form => form.id),
    };
};

type Props = {
    id?: number;
    isOpen: boolean;
    closeDialog: () => void;
    titleMessage: IntlMessage;
};

const defaultOrgUnitType: Omit<
    OrgunitType,
    'id' | 'created_at' | 'updated_at' | 'units_count'
> & {
    id: null;
} = {
    id: null,
    name: '',
    short_name: '',
    projects: [],
    depth: 0,
    sub_unit_types: [],
    reference_forms: [],
    allow_creating_sub_unit_types: [],
};
export const OrgUnitsTypesModal: FunctionComponent<Props> = ({
    id,
    titleMessage,
    closeDialog,
    isOpen,
}) => {
    const { data: initialData } = useApiV2OrgunittypesRetrieve(
        id as number,
        undefined,
        {
            query: { enabled: Boolean(id) },
        },
    );
    const orgUnitType = React.useMemo(
        () => initialData ?? defaultOrgUnitType,
        [initialData, defaultOrgUnitType],
    );

    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState(mapOrgUnitType(orgUnitType));

    // dirty fix to reupdate formState, would be worth redoing this code tbh
    React.useEffect(() => {
        if (initialData) {
            setFormState(mapOrgUnitType(initialData));
        }
    }, [initialData, setFormState]);

    const [allForms, setAllForms] = useState<FormDropdownOption[]>();
    const { data: dataForms } = useGetFormsDropdownOptions({
        extraFields: ['projects'],
    });

    const formStateUpdated = useRef(null);
    const projectsEmptyUpdated = useRef(null);
    const prevProjectIds = useRef(formState.project_ids.value);

    const { formatMessage } = useSafeIntl();

    const [referenceFormsMessage, setReferenceFormsMessage] = useState(
        isEmpty(formState.project_ids.value)
            ? MESSAGES.selectProjects
            : MESSAGES.referenceForms,
    );

    const [projectsEmpty, setProjectsEmpty] = useState(
        !!isEmpty(formState.project_ids.value),
    );
    const [selectedProjectIds, setSelectedProjectIds] = useState(null);

    const { data: allProjects } = useGetProjectsDropdownOptions();
    const { data: allOrgUnitTypes, isLoading: isLoadingOrgUitTypes } =
        useGetOrgUnitTypesDropdownOptions({
            onlyWriteAccess: true,
        });

    const { mutateAsync: saveType } = useApiV2OrgunittypesPartialUpdate({
        mutation: {
            ignoreErrorCodes: [400],
            onSuccess: () => {
                closeDialog();
                resetForm();
            },
        },
    });

    const { mutateAsync: createType } = useApiV2OrgunittypesCreate({
        mutation: {
            ignoreErrorCodes: [400],
            onSuccess: () => {
                closeDialog();
                resetForm();
            },
        },
    });

    const getFilteredForms = (
        projects,
        forms: FormDropdownOption[],
    ): FormDropdownOption[] | undefined => {
        return forms?.filter(form => {
            const formProjects = form.original.projects.map(
                project => project.id,
            );
            const sameProjectsIds = intersection(projects, formProjects);
            if (!isEmpty(sameProjectsIds)) {
                return formProjects;
            }
            return undefined;
        });
    };

    const getFormPerProjects = useCallback(
        projects => {
            let forms: FormDropdownOption[] = [];
            if (projects) {
                forms =
                    getFilteredForms(
                        projects,
                        (dataForms as FormDropdownOption[]) || [],
                    ) || [];
            }
            setFieldValue('reference_forms_ids', []);
            return forms;
        },
        [dataForms, setFieldValue],
    );

    const updateFormState = () => {
        if (formStateUpdated.current !== formState) {
            setAllForms(
                getFilteredForms(
                    formState.project_ids.value,
                    (dataForms as FormDropdownOption[]) || [],
                ),
            );

            formStateUpdated.current = formState;
        }
    };

    const updateProjectsWhenEmpty = () => {
        if (projectsEmptyUpdated.current !== formState.project_ids.value) {
            if (isEmpty(formState.project_ids.value)) {
                setProjectsEmpty(true);
                setReferenceFormsMessage(MESSAGES.selectProjects);
            } else {
                setProjectsEmpty(false);
                setReferenceFormsMessage(MESSAGES.referenceForms);
            }
        }
    };

    useSkipEffectOnMount(() => {
        updateFormState();
        updateProjectsWhenEmpty();
    }, [allForms, formState, formState.project_ids.value]);

    useEffect(() => {
        if (isUndefined(allForms) && !isEmpty(formState.project_ids.value)) {
            setAllForms(
                getFilteredForms(
                    formState.project_ids.value,
                    (dataForms as FormDropdownOption[]) || [],
                ) || [],
            );
        }
    }, [dataForms, formState.project_ids.value, allForms]);

    const currentUser = useCurrentUser();

    const handleOpenConfirmModal = useCallback(
        newProjectIds => {
            prevProjectIds.current = formState.project_ids.value;
            setSelectedProjectIds(newProjectIds);
            setConfirmCancelDialogOpen(true);
        },
        [formState.project_ids.value],
    );

    const handleDialogConfirm = useCallback(() => {
        if (selectedProjectIds) {
            setAllForms(getFormPerProjects(selectedProjectIds));
            setFieldValue('project_ids', selectedProjectIds);
        }
        setSelectedProjectIds(null);
        setConfirmCancelDialogOpen(false);
    }, [getFormPerProjects, selectedProjectIds, setFieldValue]);

    const handleDialogCancel = useCallback(() => {
        setFieldValue('project_ids', prevProjectIds.current);
        setSelectedProjectIds(null);
        setConfirmCancelDialogOpen(false);
    }, [setFieldValue]);

    const onChange = useCallback(
        (keyValue, value) => {
            if (
                keyValue === 'sub_unit_type_ids' ||
                keyValue === 'allow_creating_sub_unit_type_ids' ||
                keyValue === 'project_ids' ||
                keyValue === 'reference_forms_ids'
            ) {
                setFieldValue(keyValue, commaSeparatedIdsToArray(value));
                if (keyValue === 'project_ids') {
                    const projectIds = value
                        ?.split(',')
                        .map(val => parseInt(val, 10));
                    if (formState.reference_forms_ids.value.length > 0) {
                        handleOpenConfirmModal(projectIds);
                    } else {
                        setAllForms(getFormPerProjects(projectIds));
                    }
                }
            } else {
                setFieldValue(keyValue, value);
            }

            if (!isFieldValid(keyValue, value, requiredFields)) {
                setFieldErrors(keyValue, [
                    formatMessage(MESSAGES.requiredField),
                ]);
            }
        },
        [
            setFieldValue,
            formState.reference_forms_ids.value.length,
            handleOpenConfirmModal,
            getFormPerProjects,
            setFieldErrors,
            formatMessage,
        ],
    );

    const resetForm = useCallback(() => {
        setFormState(mapOrgUnitType(orgUnitType));
    }, [orgUnitType, setFormState]);

    const onConfirm = useCallback(() => {
        try {
            if (id) {
                saveType({ id, data: mapValues(formState, v => v.value) });
            } else {
                createType({ data: mapValues(formState, v => v.value) });
            }
        } catch (error) {
            if (error.status === 400) {
                Object.entries(error.details).forEach(entry => {
                    if (
                        entry[0] === 'sub_unit_type_ids' ||
                        entry[0] === 'allow_creating_sub_unit_type_ids'
                    ) {
                        const typeName = (entry[1] as number[]).join(', ');
                        const errorText: string = formatMessage(
                            MESSAGES.subTypesErrors,
                            {
                                typeName,
                            },
                        );
                        setFieldErrors(entry[0], [errorText]);
                    } else {
                        setFieldErrors(entry[0], entry[1]);
                    }
                });
            }
        }
    }, [
        formState,
        formatMessage,
        resetForm,
        saveType,
        setFieldErrors,
        createType,
        id,
    ]);
    const hasPermission =
        userHasOneOfPermissions(
            [Permission.ORG_UNITS, Permission.ORG_UNITS_READ],
            currentUser,
        ) && userHasPermission(Permission.FORMS, currentUser);

    const subUnitTypes: DropdownOptions<string>[] = useMemo(
        () =>
            allOrgUnitTypes?.filter(
                subUnit => subUnit.value !== `${formState.id.value}`,
            ) || [],
        [allOrgUnitTypes, formState.id.value],
    );
    const allProjectWithInvalids = useMemo(() => {
        const allUserProjectsIds = allProjects?.map(p => p.value);
        const orgUnitypeProjects: DropdownOptions<string>[] =
            orgUnitType.projects
                .filter(
                    p =>
                        allUserProjectsIds &&
                        !allUserProjectsIds.includes(`${p.id}`),
                )
                ?.map(project => ({
                    label: project.name,
                    value: `${project.id}`,
                    color: '#eb4034',
                }));

        return allProjects?.concat(orgUnitypeProjects) ?? [];
    }, [allProjects, orgUnitType.projects]);
    const [confirmCancelDialogOpen, setConfirmCancelDialogOpen] =
        useState(false);

    return (
        //  @ts-ignore
        <>
            <ConfirmCancelModal
                id="OuTypes-modal"
                open={isOpen}
                closeDialog={closeDialog}
                titleMessage={titleMessage}
                onConfirm={onConfirm}
                onCancel={() => {
                    closeDialog();
                    resetForm();
                }}
                onClose={resetForm}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                allowConfirm={isFormValid(requiredFields, formState)}
                maxWidth="sm"
                dataTestId="OuTypes-modal"
                additionalButton={undefined}
                additionalMessage={undefined}
                onAdditionalButtonClick={undefined}
            >
                <>
                    <InputComponent
                        keyValue="name"
                        onChange={onChange}
                        value={formState.name.value}
                        errors={formState.name.errors}
                        type="text"
                        label={MESSAGES.name}
                        required
                    />

                    <InputComponent
                        keyValue="short_name"
                        onChange={onChange}
                        value={formState.short_name.value}
                        errors={formState.short_name.errors}
                        type="text"
                        label={MESSAGES.shortName}
                        required
                    />

                    <InputComponent
                        multi
                        clearable
                        keyValue="project_ids"
                        onChange={onChange}
                        value={formState.project_ids.value}
                        errors={formState.project_ids.errors}
                        type="select"
                        options={allProjectWithInvalids}
                        label={MESSAGES.projects}
                        required
                    />

                    <InputComponent
                        keyValue="depth"
                        onChange={onChange}
                        value={formState.depth.value}
                        errors={formState.depth.errors}
                        type="number"
                        label={MESSAGES.depth}
                    />
                    <InputComponent
                        multi
                        clearable
                        keyValue="sub_unit_type_ids"
                        onChange={onChange}
                        loading={isLoadingOrgUitTypes}
                        value={
                            allOrgUnitTypes && formState.sub_unit_type_ids.value
                        }
                        errors={formState.sub_unit_type_ids.errors}
                        type="select"
                        options={subUnitTypes}
                        label={MESSAGES.subUnitTypes}
                    />
                    <InputWithInfos
                        infos={formatMessage(MESSAGES.createSubUnitTypesInfos)}
                    >
                        <InputComponent
                            multi
                            clearable
                            keyValue="allow_creating_sub_unit_type_ids"
                            onChange={onChange}
                            loading={isLoadingOrgUitTypes}
                            value={
                                allOrgUnitTypes &&
                                formState.allow_creating_sub_unit_type_ids.value
                            }
                            errors={
                                formState.allow_creating_sub_unit_type_ids
                                    .errors
                            }
                            type="select"
                            options={subUnitTypes}
                            label={MESSAGES.createSubUnitTypes}
                        />
                    </InputWithInfos>
                    {hasPermission && (
                        <InputComponent
                            multi
                            clearable
                            keyValue="reference_forms_ids"
                            onChange={onChange}
                            value={formState.reference_forms_ids.value}
                            errors={formState.reference_forms_ids.errors}
                            type="select"
                            disabled={projectsEmpty}
                            options={allForms || []}
                            label={referenceFormsMessage}
                        />
                    )}
                </>
            </ConfirmCancelModal>

            {/* @ts-ignore */}
            <ConfirmCancelModal
                onConfirm={() => handleDialogConfirm()}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.confirm}
                maxWidth="md"
                open={confirmCancelDialogOpen}
                closeDialog={() => null}
                onClose={() => handleDialogCancel()}
                onCancel={() => {
                    handleDialogCancel();
                }}
                id="confirm-cancel-dialog"
                dataTestId="confirm-cancel-dialog"
            >
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={styles.warningMessage}
                >
                    <WarningAmberIcon />
                    <Typography>
                        {formatMessage(MESSAGES.eraseReferenceFormsWarning)}
                    </Typography>
                </Stack>
            </ConfirmCancelModal>
        </>
    );
};

const modalWithButton = makeFullModal(OrgUnitsTypesModal, EditIconButton);
const modalWithCreateButton = makeFullModal(OrgUnitsTypesModal, AddButton);
export {
    modalWithButton as OrgUnitsTypesDialog,
    modalWithCreateButton as OrgUnitsTypesDialogAddButton,
};
