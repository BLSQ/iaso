import React, { FunctionComponent, useEffect, useMemo } from 'react';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Grid, Box, Paper } from '@mui/material';
import {
    AddButton,
    IntlFormatMessage,
    useSafeIntl,
    ConfirmCancelModal,
    makeFullModal,
    InputWithInfos,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';

import { EditIconButton } from 'Iaso/components/Buttons/EditIconButton';
import { Planning } from 'Iaso/domains/assignments/types/planning';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useGetPipelineConfig } from 'Iaso/domains/openHexa/hooks/useGetPipelineConfig';
import { useGetPipelinesDropdown } from 'Iaso/domains/openHexa/hooks/useGetPipelines';
import { useGetOrgUnit } from 'Iaso/domains/orgUnits/components/TreeView/requests';
import {
    flattenHierarchy,
    useGetOrgUnitTypesHierarchy,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { SxStyles } from 'Iaso/types/general';
import { OrgUnitsLevels as OrgUnitSelect } from '../../../../../../../../plugins/polio/js/src/components/Inputs/OrgUnitsSelect';

import DatesRange from '../../../components/filters/DatesRange';
import InputComponent from '../../../components/forms/InputComponent';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../libs/validation';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useGetProjectsDropDown } from '../../projects/hooks/requests/useGetProjectsDropDown';
import { useGetTeamsDropdown } from '../../teams/hooks/requests/useGetTeams';
import { useGetPublishingStatusOptions } from '../constants';
import {
    convertAPIErrorsToState,
    SavePlanningQuery,
    useSavePlanning,
} from '../hooks/requests/useSavePlanning';
import { usePlanningValidation } from '../hooks/validation';
import MESSAGES from '../messages';

type ModalMode = 'create' | 'edit' | 'copy';

const styles: SxStyles = {
    paper: {
        px: 2,
        pb: 2,
        mt: 2,
        border: theme =>
            // @ts-ignore
            `1px solid ${theme.palette.border.main}`,
    },
};

type Props = {
    type: ModalMode;
    planning?: Planning;
    closeDialog: () => void;
    isOpen: boolean;
};
// TODO move to utils
export const makeResetTouched =
    (
        formValues: Record<string, any>,
        setTouched: (
            fields: { [field: string]: boolean },
            shouldValidate?: boolean,
        ) => void,
    ) =>
    (): void => {
        const formKeys = Object.keys(formValues);
        const fields = {};
        formKeys.forEach(formKey => {
            fields[formKey] = true;
        });
        setTouched(fields);
    };

const formatTitle = (type: ModalMode, formatMessage: IntlFormatMessage) => {
    switch (type) {
        case 'create':
            return formatMessage(MESSAGES.createPlanning);
        case 'edit':
            return formatMessage(MESSAGES.editPlanning);
        case 'copy':
            return formatMessage(MESSAGES.duplicatePlanning);
        default:
            return formatMessage(MESSAGES.createPlanning);
    }
};

export const CreateEditPlanning: FunctionComponent<Props> = ({
    type,
    planning,
    closeDialog,
    isOpen,
}) => {
    const {
        id,
        name,
        started_at: startDate,
        ended_at: endDate,
        org_unit: selectedOrgUnit,
        team: selectedTeam,
        forms,
        project,
        description,
        published_at,
        pipeline_uuids: pipelineUuids,
        target_org_unit_type: targetOrgUnitType,
    } = planning ?? {};
    const publishingStatus = published_at ? 'published' : 'draft';
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: savePlanning } = useSavePlanning(type);
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SavePlanningQuery>, any>({
        mutationFn: savePlanning,
        onSuccess: () => {
            formik.resetForm();
        },

        convertError: convertAPIErrorsToState,
    });
    const schema = usePlanningValidation(apiErrors, payload);
    const { data: config } = useGetPipelineConfig();
    const hasPipelineConfig = config?.configured;
    const { data: pipelineUuidsOptions, isFetching: isFetchingPipelineUuids } =
        useGetPipelinesDropdown(Boolean(hasPipelineConfig));

    const formik = useFormik({
        initialValues: {
            id,
            name,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            selectedOrgUnit,
            selectedTeam,
            forms,
            project,
            description,
            publishingStatus: publishingStatus ?? 'draft',
            pipelineUuids,
            targetOrgUnitType,
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: save,
    });
    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        initialValues,
        errors,
        isValid,
        handleSubmit,
        resetForm,
        validateField,
    } = formik;

    const { data: rootorgunit, isFetching: isFetchingRootOrgUnit } =
        useGetOrgUnit(values.selectedOrgUnit?.toString());
    const { data: orgUnitTypeHierarchy, isFetching: isFetchingOrgunitTypes } =
        useGetOrgUnitTypesHierarchy(rootorgunit?.org_unit_type_id);
    const orgunitTypes = useMemo(
        () => flattenHierarchy(orgUnitTypeHierarchy?.sub_unit_types || []),
        [orgUnitTypeHierarchy],
    );
    const { data: formsDropdown, isFetching: isFetchingForms } =
        useGetFormsDropdownOptions({
            extraFields: ['project_ids'],
            params: {
                projectsIds: values?.project,
            },
        });
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsDropdown({
            project: values?.project,
        });
    // TODO filter out by team and forms
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
        // Reset validation from server to not block the user.
        // If this is not called, even changing a field won't mark the form as valid.
        validateField(keyValue);
    };
    // converting undefined to null for the API
    const onChangeDate = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        if (value === undefined) {
            setFieldValue(keyValue, null);
        } else {
            setFieldValue(keyValue, value);
        }
    };
    const getErrors = useTranslatedErrors({
        errors,
        formatMessage,
        touched,
        messages: MESSAGES,
    });
    const titleMessage = formatTitle(type, formatMessage);

    useEffect(() => {
        if (
            // Separating the check on formsDropDown and the find to skip the effect as long as forms haven't been fetched
            formsDropdown &&
            !formsDropdown?.find(
                form =>
                    values?.project &&
                    form.original?.project_ids?.includes(values?.project),
            )
        ) {
            setFieldValue('forms', null);
            setFieldTouched('forms', false);
        }
    }, [values?.project, formsDropdown, setFieldValue, setFieldTouched]);

    useEffect(() => {
        if (
            teamsDropdown &&
            !teamsDropdown?.find(
                team => team.original?.project === values?.project,
            )
        ) {
            setFieldValue('selectedTeam', null);
            setFieldTouched('selectedTeam', false);
        }
    }, [values?.project, teamsDropdown, setFieldValue, setFieldTouched]);
    const publishingStatusOptions = useGetPublishingStatusOptions();
    return (
        <FormikProvider value={formik}>
            <ConfirmCancelModal
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={() => {
                    handleSubmit();
                }}
                open={isOpen}
                onCancel={() => {
                    resetForm();
                    closeDialog();
                }}
                closeDialog={closeDialog}
                maxWidth="lg"
                onClose={() => null}
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                id={`${id ?? 'create'}-planning-dialog`}
                dataTestId={`${id ?? 'create'}-planning-dialog`}
            >
                <Box mt={1}>
                    <Grid container spacing={2}>
                        <Grid xs={12} md={6} item>
                            <Grid container spacing={2}>
                                <Grid xs={12} item>
                                    <InputComponent
                                        keyValue="name"
                                        onChange={onChange}
                                        value={values.name}
                                        errors={getErrors('name')}
                                        type="text"
                                        label={MESSAGES.name}
                                        required
                                        withMarginTop={false}
                                    />
                                </Grid>
                            </Grid>
                            <InputWithInfos
                                infos={formatMessage(
                                    MESSAGES.projectSelectHelperText,
                                )}
                            >
                                <Box sx={styles.paper}>
                                    <Grid container spacing={2}>
                                        <Grid xs={6} item>
                                            <InputComponent
                                                type="select"
                                                keyValue="project"
                                                onChange={onChange}
                                                value={
                                                    isFetchingProjects
                                                        ? undefined
                                                        : values.project
                                                }
                                                errors={getErrors('project')}
                                                label={MESSAGES.project}
                                                required
                                                options={projectsDropdown}
                                                loading={isFetchingProjects}
                                            />
                                        </Grid>
                                        <Grid xs={6} item>
                                            <InputComponent
                                                type="select"
                                                keyValue="selectedTeam"
                                                onChange={onChange}
                                                value={values.selectedTeam}
                                                errors={getErrors(
                                                    'selectedTeam',
                                                )}
                                                label={MESSAGES.team}
                                                required
                                                options={teamsDropdown || []}
                                                loading={isFetchingTeams}
                                                disabled={!values.project}
                                            />
                                        </Grid>
                                    </Grid>
                                    <InputComponent
                                        type="select"
                                        keyValue="forms"
                                        onChange={(keyValue, value) =>
                                            onChange(
                                                keyValue,
                                                commaSeparatedIdsToArray(value),
                                            )
                                        }
                                        value={values.forms}
                                        errors={getErrors('forms')}
                                        label={MESSAGES.forms}
                                        required
                                        multi
                                        options={formsDropdown}
                                        loading={isFetchingForms}
                                        disabled={!values.project}
                                    />
                                </Box>
                            </InputWithInfos>
                            <InputWithInfos
                                infos={formatMessage(
                                    MESSAGES.targetOrgUnitTypeInfos,
                                )}
                            >
                                <Box sx={styles.paper}>
                                    <Field
                                        required
                                        component={OrgUnitSelect}
                                        label={formatMessage(
                                            MESSAGES.selectOrgUnit,
                                        )}
                                        name="selectedOrgUnit"
                                        errors={getErrors('selectedOrgUnit')}
                                    />
                                    <InputComponent
                                        type="select"
                                        keyValue="targetOrgUnitType"
                                        label={MESSAGES.targetOrgUnitType}
                                        onChange={onChange}
                                        errors={getErrors('targetOrgUnitType')}
                                        value={
                                            isFetchingOrgunitTypes ||
                                            isFetchingRootOrgUnit
                                                ? undefined
                                                : values.targetOrgUnitType
                                        }
                                        disabled={!values.selectedOrgUnit}
                                        options={orgunitTypes || []}
                                        loading={
                                            isFetchingOrgunitTypes ||
                                            isFetchingRootOrgUnit
                                        }
                                    />
                                </Box>
                            </InputWithInfos>
                        </Grid>

                        <Grid xs={12} md={6} item>
                            <DatesRange
                                onChangeDate={onChangeDate}
                                dateFrom={values.startDate}
                                dateTo={values.endDate}
                                labelFrom={MESSAGES.startDatefrom}
                                labelTo={MESSAGES.endDateUntil}
                                keyDateFrom="startDate"
                                keyDateTo="endDate"
                                errors={[
                                    getErrors('startDate'),
                                    getErrors('endDate'),
                                ]}
                                blockInvalidDates={false}
                                marginTop={0}
                            />
                            <InputComponent
                                keyValue="description"
                                onChange={onChange}
                                value={values.description}
                                errors={getErrors('description')}
                                type="textarea"
                                label={MESSAGES.description}
                            />
                            {hasPipelineConfig && (
                                <InputComponent
                                    type="select"
                                    multi
                                    keyValue="pipelineUuids"
                                    onChange={(keyValue, value) =>
                                        onChange(
                                            keyValue,
                                            value ? value.split(',') : [],
                                        )
                                    }
                                    loading={isFetchingPipelineUuids}
                                    options={pipelineUuidsOptions}
                                    value={values.pipelineUuids}
                                    errors={getErrors('pipelineUuids')}
                                    label={MESSAGES.pipelines}
                                />
                            )}
                            <InputComponent
                                type="radio"
                                keyValue="publishingStatus"
                                onChange={onChange}
                                value={values.publishingStatus}
                                errors={getErrors('publishingStatus')}
                                label={MESSAGES.publishingStatus}
                                options={publishingStatusOptions}
                                required
                            />
                        </Grid>
                    </Grid>
                </Box>
            </ConfirmCancelModal>
        </FormikProvider>
    );
};

type DuplicateButtonProps = {
    onClick: () => void;
    disabled?: boolean;
};

const DuplicateIconButton: FunctionComponent<DuplicateButtonProps> = ({
    onClick,
    disabled = false,
}) => {
    return (
        <EditIconButton
            onClick={onClick}
            overrideIcon={FileCopyIcon}
            message={MESSAGES.duplicatePlanning}
            disabled={disabled}
        />
    );
};

const modalCreateButton = makeFullModal(CreateEditPlanning, AddButton);
const modalEditIcon = makeFullModal(CreateEditPlanning, EditIconButton);
const modalDuplicateIcon = makeFullModal(
    CreateEditPlanning,
    DuplicateIconButton,
);

export {
    modalCreateButton as CreatePlanning,
    modalEditIcon as EditPlanning,
    modalDuplicateIcon as DuplicatePlanning,
};
