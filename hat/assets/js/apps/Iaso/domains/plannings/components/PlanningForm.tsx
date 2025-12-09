import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { Grid, Box, Button } from '@mui/material';
import { useSafeIntl, InputWithInfos } from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
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
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useGetProjectsDropDown } from '../../projects/hooks/requests/useGetProjectsDropDown';
import { useGetTeamsDropdown } from '../../teams/hooks/requests/useGetTeams';
import { useGetPublishingStatusOptions } from '../constants';
import { useGetPlanningDetails } from '../hooks/requests/useGetPlanningDetails';

import {
    convertAPIErrorsToState,
    SavePlanningQuery,
    useSavePlanning,
} from '../hooks/requests/useSavePlanning';
import { usePlanningValidation } from '../hooks/validation';
import MESSAGES from '../messages';
import { PageMode } from '../types';

const styles: SxStyles = {
    paper: {
        px: 2,
        pb: 2,
        border: theme =>
            // @ts-ignore
            `1px solid ${theme.palette.border.main}`,
        borderRadius: 1,
    },
};

type Props = {
    hasPipelineConfig: boolean;
};

export const PlanningForm: FunctionComponent<Props> = ({
    hasPipelineConfig,
}) => {
    const params = useParamsObject(baseUrls.planningDetails);
    const { planningId } = params;
    const { data: planning } = useGetPlanningDetails(planningId);

    const {
        id,
        name,
        started_at,
        ended_at,
        org_unit: selectedOrgUnit,
        team: selectedTeam,
        forms,
        project,
        description,
        published_at,
        pipeline_uuids: pipelineUuids,
        target_org_unit_type: targetOrgUnitType,
    } = planning ?? {};
    const startDate = started_at ? moment(started_at).format('L') : undefined;
    const endDate = ended_at ? moment(ended_at).format('L') : undefined;
    const publishingStatus = published_at ? 'published' : 'draft';
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: savePlanning } = useSavePlanning(
        params.mode as PageMode,
    );
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
        validateField,
    } = formik;
    const allowConfirm =
        isValid && (!isEqual(values, initialValues) || params.mode === 'copy');

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
            enabled: Boolean(values?.project),
        });
    const { data: teamsDropdown, isFetching: isFetchingTeams } =
        useGetTeamsDropdown(
            {
                project: values?.project,
            },
            undefined,
            Boolean(values?.project),
        );
    // TODO filter out by team and forms
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();

    const onChange = (keyValue, value) => {
        if (keyValue === 'project') {
            setFieldValue('selectedTeam', null);
            setFieldTouched('selectedTeam', false);
            setFieldValue('forms', null);
            setFieldTouched('forms', false);
        }
        if (keyValue === 'selectedOrgUnit') {
            setFieldValue('targetOrgUnitType', null);
            setFieldTouched('targetOrgUnitType', false);
        }
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
            <Grid container spacing={2}>
                <Grid xs={12} md={4} item>
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

                    <DatesRange
                        onChangeDate={onChangeDate}
                        dateFrom={values.startDate}
                        dateTo={values.endDate}
                        labelFrom={MESSAGES.startDatefrom}
                        labelTo={MESSAGES.endDateUntil}
                        keyDateFrom="startDate"
                        keyDateTo="endDate"
                        errors={[getErrors('startDate'), getErrors('endDate')]}
                        blockInvalidDates={false}
                    />
                    <InputComponent
                        keyValue="description"
                        onChange={onChange}
                        value={values.description}
                        errors={getErrors('description')}
                        type="textarea"
                        label={MESSAGES.description}
                    />
                </Grid>

                <Grid xs={12} md={4} item>
                    <InputWithInfos
                        infos={formatMessage(MESSAGES.projectSelectHelperText)}
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
                                        errors={getErrors('selectedTeam')}
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
                </Grid>

                <Grid xs={12} md={4} item>
                    <InputWithInfos
                        infos={formatMessage(MESSAGES.targetOrgUnitTypeInfos)}
                    >
                        <Box sx={styles.paper}>
                            <Field
                                required
                                component={OrgUnitSelect}
                                label={formatMessage(MESSAGES.selectOrgUnit)}
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
                    <Grid container spacing={2}>
                        <Grid xs={6} lg={5} item>
                            <Box sx={styles.paper} mt={2}>
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
                            </Box>
                        </Grid>
                        <Grid
                            xs={6}
                            lg={7}
                            item
                            justifyContent="flex-end"
                            display="flex"
                            alignItems="flex-end"
                        >
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => handleSubmit()}
                                disabled={!allowConfirm}
                            >
                                {formatMessage(MESSAGES.save)}
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </FormikProvider>
    );
};
