import React, { FunctionComponent, useMemo, useEffect, useState } from 'react';
import {
    AddButton,
    useSafeIntl,
    IconButton,
    IntlFormatMessage,
} from 'bluesquare-components';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { useFormik, FormikProvider, Field } from 'formik';
import { isEqual } from 'lodash';
import { Grid, Box } from '@mui/material';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

import MESSAGES from '../messages';

import { useGetForms } from '../hooks/requests/useGetForms';
import { useGetTeams } from '../hooks/requests/useGetTeams';
import {
    convertAPIErrorsToState,
    SavePlanningQuery,
    useSavePlanning,
} from '../hooks/requests/useSavePlanning';
import DatesRange from '../../../components/filters/DatesRange';
import { OrgUnitsLevels as OrgUnitSelect } from '../../../../../../../../plugins/polio/js/src/components/Inputs/OrgUnitsSelect';
import { usePlanningValidation } from '../hooks/validation';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useGetProjectsDropDown } from '../../projects/hooks/requests/useGetProjectsDropDown';
import {
    useApiErrorValidation,
    useTranslatedErrors,
} from '../../../libs/validation';

type ModalMode = 'create' | 'edit' | 'copy';

type Props = Partial<SavePlanningQuery> & {
    type: ModalMode;
};

const removePadding = { paddingTop: 4, paddingBottom: 4 };
const makeRenderTrigger = (type: 'create' | 'edit' | 'copy') => {
    if (type === 'create') {
        return ({ openDialog }) => (
            <AddButton
                dataTestId="create-plannning-button"
                onClick={openDialog}
            />
        );
    }
    if (type === 'copy') {
        return ({ openDialog }) => (
            <IconButton
                onClick={openDialog}
                overrideIcon={FileCopyIcon}
                tooltipMessage={MESSAGES.duplicatePlanning}
            />
        );
    }
    return ({ openDialog }) => (
        <IconButton
            onClick={openDialog}
            icon="edit"
            tooltipMessage={MESSAGES.edit}
        />
    );
};

// TODO move to utils
export const makeResetTouched =
    (
        formValues: Record<string, any>,
        setTouched: (
            // eslint-disable-next-line no-unused-vars
            fields: { [field: string]: boolean },
            // eslint-disable-next-line no-unused-vars
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
    id,
    name,
    startDate,
    endDate,
    selectedOrgUnit,
    selectedTeam,
    forms,
    project,
    description,
    publishingStatus,
}) => {
    const { formatMessage } = useSafeIntl();
    const [closeModal, setCloseModal] = useState<any>();
    const { mutateAsync: savePlanning } = useSavePlanning(type);
    const {
        apiErrors,
        payload,
        mutation: save,
    } = useApiErrorValidation<Partial<SavePlanningQuery>, any>({
        mutationFn: savePlanning,
        onSuccess: () => {
            closeModal.closeDialog();
            formik.resetForm();
        },

        convertError: convertAPIErrorsToState,
    });

    const schema = usePlanningValidation(apiErrors, payload);

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
    } = formik;

    const { data: formsDropdown, isFetching: isFetchingForms } = useGetForms(
        values?.project,
    );
    const { data: teamsDropdown, isFetching: isFetchingTeams } = useGetTeams(
        values?.project,
    );
    // TODO filter out by team and forms
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();

    const renderTrigger = useMemo(() => makeRenderTrigger(type), [type]);

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
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

    const showTeamHelperText =
        getErrors('selectedTeam').length === 0 && !values.project;
    const showFormsHelperText =
        getErrors('forms').length === 0 && !values.project;

    useEffect(() => {
        if (
            // Separating the check on formsDropDown and the find to skip the effect as long as forms haven't been fetched
            formsDropdown &&
            !formsDropdown?.find(form =>
                form.original?.project_ids.includes(values?.project),
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
                team =>
                    parseInt(team.original?.project, 10) === values?.project,
            )
        ) {
            setFieldValue('selectedTeam', null);
            setFieldTouched('selectedTeam', false);
        }
    }, [values?.project, teamsDropdown, setFieldValue, setFieldTouched]);

    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={closeDialog => {
                    setCloseModal({ closeDialog });
                    handleSubmit();
                }}
                onCancel={closeDialog => {
                    closeDialog();
                    resetForm();
                }}
                maxWidth="md"
                cancelMessage={MESSAGES.cancel}
                confirmMessage={MESSAGES.save}
                renderTrigger={renderTrigger}
            >
                <>
                    <Grid container id="top-row" spacing={2}>
                        <Grid xs={6} item style={removePadding}>
                            <InputComponent
                                keyValue="name"
                                onChange={onChange}
                                value={values.name}
                                errors={getErrors('name')}
                                type="text"
                                label={MESSAGES.name}
                                required
                            />
                        </Grid>
                        <Grid xs={6} item style={removePadding}>
                            <InputComponent
                                type="select"
                                keyValue="project"
                                onChange={onChange}
                                value={values.project}
                                errors={getErrors('project')}
                                label={MESSAGES.project}
                                required
                                options={projectsDropdown}
                                loading={isFetchingProjects}
                            />
                        </Grid>
                    </Grid>
                    <Grid container id="middle-row" spacing={2}>
                        <Grid xs={6} item style={removePadding}>
                            <InputComponent
                                type="select"
                                keyValue="selectedTeam"
                                onChange={onChange}
                                value={values.selectedTeam}
                                errors={getErrors('selectedTeam')}
                                label={MESSAGES.team}
                                required
                                options={teamsDropdown}
                                loading={isFetchingTeams}
                                disabled={!values.project}
                                helperText={
                                    showTeamHelperText
                                        ? formatMessage(
                                              MESSAGES.teamSelectHelperText,
                                          )
                                        : undefined
                                }
                            />
                        </Grid>
                        <Grid xs={6} item style={removePadding}>
                            <InputComponent
                                type="select"
                                keyValue="forms"
                                onChange={(keyValue, value) => {
                                    onChange(
                                        keyValue,
                                        commaSeparatedIdsToArray(value),
                                    );
                                }}
                                value={values.forms}
                                errors={getErrors('forms')}
                                label={MESSAGES.forms}
                                required
                                multi
                                options={formsDropdown}
                                loading={isFetchingForms}
                                disabled={!values.project}
                                helperText={
                                    showFormsHelperText
                                        ? formatMessage(
                                              MESSAGES.formSelectHelperText,
                                          )
                                        : undefined
                                }
                            />
                        </Grid>
                    </Grid>
                    <Grid container id="last-row" spacing={2}>
                        <Grid item xs={6} style={removePadding}>
                            <Box mt={1}>
                                <Field
                                    required
                                    component={OrgUnitSelect}
                                    label={formatMessage(
                                        MESSAGES.selectOrgUnit,
                                    )}
                                    name="selectedOrgUnit"
                                    errors={getErrors('selectedOrgUnit')}
                                />
                            </Box>
                        </Grid>
                        <Grid xs={6} item style={removePadding}>
                            <InputComponent
                                keyValue="description"
                                onChange={onChange}
                                value={values.description}
                                errors={getErrors('description')}
                                type="text"
                                label={MESSAGES.description}
                            />
                        </Grid>
                    </Grid>
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
                        marginTop={0}
                    />
                    <Grid item>
                        <InputComponent
                            type="radio"
                            keyValue="publishingStatus"
                            onChange={onChange}
                            value={values.publishingStatus}
                            errors={getErrors('publishingStatus')}
                            label={MESSAGES.publishingStatus}
                            options={[
                                {
                                    label: formatMessage(MESSAGES.published),
                                    value: 'published',
                                },
                                {
                                    label: formatMessage(MESSAGES.draft),
                                    value: 'draft',
                                },
                            ]}
                            required
                        />
                    </Grid>
                </>
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
