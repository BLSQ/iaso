import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { AddButton, useSafeIntl, IconButton } from 'bluesquare-components';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useFormik, FormikProvider, Field } from 'formik';
import { isEqual } from 'lodash';
import { Grid, Box } from '@material-ui/core';
import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

import MESSAGES from '../messages';

import { useGetForms } from '../hooks/requests/useGetForms';
import { useGetTeams } from '../hooks/requests/useGetTeams';
import {
    SavePlanningQuery,
    useSavePlanning,
} from '../hooks/requests/useSavePlanning';
import DatesRange from '../../../components/filters/DatesRange';
import { OrgUnitsLevels as OrgUnitSelect } from '../../../../../../../../plugins/polio/js/src/components/Inputs/OrgUnitsSelect';
// import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import { usePlanningValidation } from '../validation';
import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { IntlFormatMessage } from '../../../types/intl';
import { useGetProjectsDropDown } from '../hooks/requests/useGetProjectsDropDown';

type ModalMode = 'create' | 'edit' | 'copy';

type Props = Partial<SavePlanningQuery> & {
    type: ModalMode;
};

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
                tooltipMessage={MESSAGES.edit}
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
    const { data: formsDropdown, isFetching: isFetchingForms } = useGetForms();
    const { data: teamsDropdown, isFetching: isFetchingTeams } = useGetTeams();
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();
    // Tried the typescript integration, but Type casting was crap
    const schema = usePlanningValidation();
    const { mutateAsync: savePlanning } = useSavePlanning(type);

    const renderTrigger = useMemo(() => makeRenderTrigger(type), [type]);

    const formik = useFormik({
        initialValues: {
            id,
            name,
            startDate,
            endDate,
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
        onSubmit: (values: Partial<SavePlanningQuery>) => savePlanning(values), // TODO: convert forms string to Arry of IDs
    });

    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        errors,
        isValid,
        initialValues,
        handleSubmit,
        resetForm,
    } = formik;
    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };
    const getErrors = useCallback(
        keyValue => {
            if (!touched[keyValue]) return [];
            return errors[keyValue] ? [errors[keyValue]] : [];
        },
        [errors, touched],
    );
    const titleMessage = formatTitle(type, formatMessage);
    return (
        <FormikProvider value={formik}>
            {/* @ts-ignore */}
            <ConfirmCancelDialogComponent
                allowConfirm={isValid && !isEqual(values, initialValues)}
                titleMessage={titleMessage}
                onConfirm={closeDialog => {
                    closeDialog();
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
                <Grid container spacing={2}>
                    <Grid container item spacing={2}>
                        <Grid xs={6} item>
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
                        <Grid xs={6} item>
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
                            />
                        </Grid>
                    </Grid>
                    <Grid container item spacing={2}>
                        <Grid xs={6} item>
                            <InputComponent
                                keyValue="description"
                                onChange={onChange}
                                value={values.description}
                                errors={getErrors('description')}
                                type="text"
                                label={MESSAGES.description}
                            />
                        </Grid>
                        <Grid xs={6} item>
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
                    <Grid item xs={12}>
                        <DatesRange
                            onChangeDate={onChange}
                            dateFrom={values.startDate}
                            dateTo={values.endDate}
                            labelFrom={MESSAGES.from}
                            labelTo={MESSAGES.to}
                            keyDateFrom="startDate"
                            keyDateTo="endDate"
                        />
                    </Grid>
                    <Grid container item spacing={2}>
                        <Grid xs={6} item>
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
                            />
                        </Grid>
                        <Grid xs={6} item>
                            <Box mt={1}>
                                <Field
                                    component={OrgUnitSelect}
                                    label={formatMessage(
                                        MESSAGES.selectOrgUnit,
                                    )}
                                    name="selectedOrgUnit"
                                />
                            </Box>
                        </Grid>
                    </Grid>
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
                </Grid>
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
