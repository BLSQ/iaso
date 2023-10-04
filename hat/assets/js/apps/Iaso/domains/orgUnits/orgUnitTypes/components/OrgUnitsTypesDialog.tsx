import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
    useMemo,
    FunctionComponent,
    ReactNode,
} from 'react';
import {
    useSafeIntl,
    useSkipEffectOnMount,
    IntlMessage,
} from 'bluesquare-components';
import intersection from 'lodash/intersection';
import isEmpty from 'lodash/isEmpty';
import { isUndefined, mapValues } from 'lodash';

import { useGetFormsByProjects } from '../../../instances/hooks';
import ConfirmCancelDialogComponent from '../../../../components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from '../../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { userHasPermission } from '../../../users/utils';
import { useFormState } from '../../../../hooks/form';
import {
    commaSeparatedIdsToArray,
    isFieldValid,
    isFormValid,
} from '../../../../utils/forms';
import { requiredFields } from '../config/requiredFields';
import { useGetProjectsDropdownOptions } from '../../../projects/hooks/requests';
import { useGetOrgUnitTypesDropdownOptions } from '../hooks/useGetOrgUnitTypesDropdownOptions';
import { useSaveOrgUnitType } from '../hooks/useSaveOrgUnitType';
import { useCurrentUser } from '../../../../utils/usersUtils';
import { OrgunitType } from '../../types/orgunitTypes';
import { DropdownOptions } from '../../../../types/utils';
import { Form } from '../../../forms/types/forms';
import * as Permission from '../../../../utils/permissions';
import { InputWithInfos } from '../../../../components/InputWithInfos';

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
    // eslint-disable-next-line no-unused-vars
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
    const { formatMessage } = useSafeIntl();

    const [referenceFormsMessage, setReferenceFormsMessage] = useState(
        isEmpty(formState.project_ids.value)
            ? MESSAGES.selectProjects
            : MESSAGES.referenceForms,
    );

    const [projectsEmpty, setProjectsEmpty] = useState(
        !!isEmpty(formState.project_ids.value),
    );

    const { data: allProjects } = useGetProjectsDropdownOptions();
    const { data: allOrgUnitTypes, isLoading: isLoadingOrgUitTypes } =
        useGetOrgUnitTypesDropdownOptions();
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
            setFieldValue('reference_forms_ids', null);
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
                        .map((val: string) => parseInt(val, 10));
                    setAllForms(getFormPerProjects(projectIds));
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
        [setFieldValue, setFieldErrors, formatMessage, getFormPerProjects],
    );

    const onConfirm = useCallback(
        async (closeDialog: () => void) => {
            try {
                await saveType(mapValues(formState, v => v.value));
                closeDialog();
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
        userHasPermission(Permission.ORG_UNITS, currentUser) &&
        userHasPermission(Permission.FORMS, currentUser);

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
    return (
        //  @ts-ignore
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
                    errors={formState.allow_creating_sub_unit_type_ids.errors}
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
    );
};
