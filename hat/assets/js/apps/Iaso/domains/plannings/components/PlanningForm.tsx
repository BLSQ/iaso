import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Assignment } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import { Grid, Box, Button } from '@mui/material';
import {
    useSafeIntl,
    InputWithInfos,
    useRedirectToReplace,
    useRedirectTo,
    LinkButton,
} from 'bluesquare-components';
import { Field, FormikProvider, useFormik } from 'formik';
import { isEqual } from 'lodash';
import moment from 'moment';
import DeleteDialog from 'Iaso/components/dialogs/DeleteDialogComponent';
import { DisplayIfUserHasPerm } from 'Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from 'Iaso/constants/urls';
import { useGetFormsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { useGetPipelinesDropdown } from 'Iaso/domains/openHexa/hooks/useGetPipelines';
import { useGetOrgUnit } from 'Iaso/domains/orgUnits/components/TreeView/requests';
import {
    flattenHierarchy,
    useGetOrgUnitTypesHierarchy,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { useSkipEffectUntilValue } from 'Iaso/hooks/useSkipEffectUntilValue';
import { SxStyles } from 'Iaso/types/general';
import { PLANNING_WRITE } from 'Iaso/utils/permissions';
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
import { useDeletePlanning } from '../hooks/requests/useDeletePlanning';
import {
    convertAPIErrorsToState,
    SavePlanningQuery,
    useSavePlanning,
} from '../hooks/requests/useSavePlanning';
import { usePlanningValidation } from '../hooks/validation';
import MESSAGES from '../messages';
import { Planning, PageMode } from '../types';
import { canAssignPlanning } from '../utils';

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
    planning?: Planning;
    mode: PageMode;
};

export const PlanningForm: FunctionComponent<Props> = ({
    hasPipelineConfig,
    planning,
    mode,
}) => {
    const {
        id,
        name,
        started_at,
        ended_at,
        org_unit_details,
        team_details,
        forms,
        project_details,
        description,
        published_at,
        pipeline_uuids: pipelineUuids,
        target_org_unit_type_details,
    } = useMemo(() => planning ?? {}, [planning]) as Planning;
    const selectedOrgUnit = org_unit_details?.id;
    const selectedTeam = team_details?.id;
    const project = project_details?.id;
    const targetOrgUnitType = target_org_unit_type_details?.id;
    const assignmentUrl = `/${baseUrls.assignments}/planningId/${id}/team/${selectedTeam}`;
    const startDate = started_at ? moment(started_at).format('L') : undefined;
    const endDate = ended_at ? moment(ended_at).format('L') : undefined;
    const publishingStatus = published_at ? 'published' : 'draft';
    const { formatMessage } = useSafeIntl();
    const redirectToReplace = useRedirectToReplace();
    const redirectTo = useRedirectTo();
    const onSaveSuccess = useCallback(
        result => {
            if (mode !== 'edit') {
                redirectToReplace(baseUrls.planningDetails, {
                    mode: 'edit',
                    planningId: `${result.id}`,
                });
            }
        },
        [mode, redirectToReplace],
    );
    const { mutateAsync: savePlanning } = useSavePlanning({
        type: mode,
        onSuccess: onSaveSuccess,
    });
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SavePlanningQuery>, any>({
        mutationFn: savePlanning,
        onSuccess: (result: Planning) => {
            if (mode !== 'edit') {
                redirectToReplace(`/${baseUrls.planningDetails}`, {
                    mode: 'edit',
                    planningId: `${result.id}`,
                });
            }
        },

        convertError: convertAPIErrorsToState,
    });
    const { mutateAsync: deletePlanning } = useDeletePlanning({
        onSuccessCustomAction: () => {
            redirectTo(`/${baseUrls.planning}`);
        },
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
    const isPublishing = formik.values.publishingStatus === 'published';
    const hasStarted =
        formik.values.startDate &&
        moment().isAfter(moment(formik.values.startDate), 'day');
    const isPublishingDisabled = isPublishing || !hasStarted;
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
        isValid && (!isEqual(values, initialValues) || mode === 'copy');

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
            setFieldTouched('selectedTeam', false);
            setFieldTouched('forms', false);
            setFieldValue('selectedTeam', null);
            setFieldValue('forms', null);
        }
        if (keyValue === 'selectedOrgUnit') {
            setFieldTouched('targetOrgUnitType', false);
            setFieldValue('targetOrgUnitType', null);
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
    const resetFormsOnProjectChange = useCallback(() => {
        if (
            formsDropdown &&
            !formsDropdown?.find(
                form =>
                    values?.project &&
                    form.original?.project_ids?.includes(values?.project),
            )
        ) {
            setFieldTouched('forms', false);
            setFieldValue('forms', null);
        }
    }, [formsDropdown, setFieldTouched, setFieldValue, values?.project]);

    const resetTeamsOnProjectChange = useCallback(() => {
        if (
            teamsDropdown &&
            !teamsDropdown?.find(
                team => team.original?.project === values?.project,
            )
        ) {
            setFieldValue('selectedTeam', null);
            setFieldTouched('selectedTeam', false);
        }
    }, [teamsDropdown, setFieldTouched, setFieldValue, values?.project]);

    useSkipEffectUntilValue(formsDropdown, resetFormsOnProjectChange);
    useSkipEffectUntilValue(teamsDropdown, resetTeamsOnProjectChange);
    const publishingStatusOptions = useGetPublishingStatusOptions();
    const canAssign = canAssignPlanning(planning);
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
                        disabled={isPublishingDisabled}
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
                        disabled={isPublishingDisabled}
                    />
                    <InputComponent
                        keyValue="description"
                        onChange={onChange}
                        value={values.description}
                        errors={getErrors('description')}
                        type="textarea"
                        label={MESSAGES.description}
                        disabled={isPublishingDisabled}
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
                                        disabled={isPublishingDisabled}
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
                                        disabled={
                                            !values.project ||
                                            isPublishingDisabled
                                        }
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
                                disabled={
                                    !values.project || isPublishingDisabled
                                }
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
                            disabled={isPublishingDisabled}
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
                                disabled={isPublishingDisabled}
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
                                disabled={
                                    !values.selectedOrgUnit ||
                                    isPublishingDisabled
                                }
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
                        <Grid item xs={6} lg={7}>
                            <Box
                                display="flex"
                                gap={2}
                                flexDirection="column"
                                justifyContent="flex-end"
                                alignItems="flex-end"
                                mt={2}
                            >
                                <Button
                                    disabled={!allowConfirm}
                                    color="primary"
                                    variant="contained"
                                    startIcon={<SaveRoundedIcon />}
                                    onClick={() => handleSubmit()}
                                >
                                    {formatMessage(MESSAGES.save)}
                                </Button>
                                {mode === 'edit' && (
                                    <>
                                        <DisplayIfUserHasPerm
                                            permissions={[PLANNING_WRITE]}
                                        >
                                            <DeleteDialog
                                                iconColor="error"
                                                titleMessage={{
                                                    ...MESSAGES.deletePlanning,
                                                    values: {
                                                        planningName:
                                                            values.name,
                                                    },
                                                }}
                                                message={{
                                                    ...MESSAGES.deleteWarning,
                                                    values: {
                                                        name: values.name,
                                                    },
                                                }}
                                                disabled={false}
                                                onConfirm={() =>
                                                    deletePlanning(values.id)
                                                }
                                                keyName="delete-planning"
                                                Trigger={({ onClick }) => (
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        onClick={onClick}
                                                        startIcon={
                                                            <DeleteIcon />
                                                        }
                                                        disabled={
                                                            isPublishingDisabled
                                                        }
                                                    >
                                                        {formatMessage(
                                                            MESSAGES.delete,
                                                        )}
                                                    </Button>
                                                )}
                                            />
                                        </DisplayIfUserHasPerm>
                                        <LinkButton
                                            variant="outlined"
                                            startIcon={<FileCopyIcon />}
                                            to={`/${baseUrls.planningDetails}/planningId/${values.id}/mode/copy`}
                                        >
                                            {formatMessage(
                                                MESSAGES.duplicatePlanning,
                                            )}
                                        </LinkButton>
                                        <LinkButton
                                            disabled={!canAssign}
                                            to={assignmentUrl}
                                            variant="outlined"
                                            startIcon={<Assignment />}
                                        >
                                            {formatMessage(
                                                MESSAGES.assignments,
                                            )}
                                        </LinkButton>
                                    </>
                                )}
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </FormikProvider>
    );
};
