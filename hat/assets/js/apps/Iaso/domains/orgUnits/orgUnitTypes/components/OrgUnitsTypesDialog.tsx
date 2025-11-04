import React, {
    FunctionComponent,
    ReactNode,
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
} from 'bluesquare-components';
import { isUndefined, mapValues } from 'lodash';
import intersection from 'lodash/intersection';
import isEmpty from 'lodash/isEmpty';

import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import { useFormState } from '../../../../hooks/form';
import { DropdownOptions } from '../../../../types/utils';
import {
    commaSeparatedIdsToArray,
    isFieldValid,
    isFormValid,
} from '../../../../utils/forms';
import * as Permission from '../../../../utils/permissions';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { Form } from '../../../forms/types/forms';
import { useGetFormsByProjects } from '../../../instances/hooks';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import {
    userHasOneOfPermissions,
    userHasPermission,
} from '../../../users/utils';
import { OrgunitType } from '../../types/orgunitTypes';
import { requiredFields } from '../config/requiredFields';
import { useGetOrgUnitTypesDropdownOptions } from '../hooks/useGetOrgUnitTypesDropdownOptions';
import { useSaveOrgUnitType } from '../hooks/useSaveOrgUnitType';
import MESSAGES from '../messages';

const styles = {
    warningMessage: theme => ({
        padding: '5px',
        color: theme.palette.warning.main,
    }),
};
const mapOrgUnitType = orgUnitType => {
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
    orgUnitType?: OrgunitType;
    titleMessage: IntlMessage;
    renderTrigger: ({ openDialog }: { openDialog: () => void }) => ReactNode;
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
export const OrgUnitsTypesDialog: FunctionComponent<Props> = ({
    orgUnitType = defaultOrgUnitType,
    titleMessage,
    renderTrigger,
}) => {
    const [formState, setFieldValue, setFieldErrors, setFormState] =
        useFormState(mapOrgUnitType(orgUnitType));

    const [allForms, setAllForms] = useState<Form[]>();
    const { data } = useGetFormsByProjects();
    const dataForms = data && data.forms;

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
    const { mutateAsync: saveType } = useSaveOrgUnitType();

    const getFilteredForms = (projects, forms) => {
        return forms?.filter(form => {
            const formProjects = form.projects.map(project => project.id);
            const sameProjectsIds = intersection(projects, formProjects);
            if (!isEmpty(sameProjectsIds)) {
                return formProjects;
            }
            return null;
        });
    };

    const getFormPerProjects = useCallback(
        projects => {
            let forms = [];
            if (projects) {
                forms = getFilteredForms(projects, dataForms);
            }
            setFieldValue('reference_forms_ids', []);
            return forms;
        },
        [dataForms, setFieldValue],
    );

    const updateFormState = () => {
        if (formStateUpdated.current !== formState) {
            setAllForms(
                getFilteredForms(formState.project_ids.value, dataForms),
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
                getFilteredForms(formState.project_ids.value, dataForms),
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

    const onConfirm = useCallback(
        (closeDialog: () => void) => {
            try {
                saveType(
                    mapValues(formState, v => v.value),
                    {
                        onSuccess: () => {
                            closeDialog();
                            resetForm();
                        },
                    },
                );
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
        },
        [formState, formatMessage, saveType, setFieldErrors],
    );
    const hasPermission =
        userHasOneOfPermissions(
            [Permission.ORG_UNITS, Permission.ORG_UNITS_READ],
            currentUser,
        ) && userHasPermission(Permission.FORMS, currentUser);

    const resetForm = () => {
        setFormState(mapOrgUnitType(orgUnitType));
    };
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
            <ConfirmCancelDialogComponent
                id="OuTypes-modal"
                titleMessage={titleMessage}
                onConfirm={closeDialog => onConfirm(closeDialog)}
                onCancel={closeDialog => {
                    closeDialog();
                    resetForm();
                }}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                allowConfirm={isFormValid(requiredFields, formState)}
                maxWidth="sm"
                renderTrigger={renderTrigger}
                dataTestId="OuTypes-modal"
                additionalButton={undefined}
                additionalMessage={undefined}
                onAdditionalButtonClick={undefined}
                allowConfimAdditionalButton={undefined}
            >
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
                    value={allOrgUnitTypes && formState.sub_unit_type_ids.value}
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
                            formState.allow_creating_sub_unit_type_ids.errors
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
                        options={
                            allForms &&
                            allForms.map(form => ({
                                value: form.id,
                                label: form.name,
                            }))
                        }
                        label={referenceFormsMessage}
                    />
                )}
            </ConfirmCancelDialogComponent>

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
