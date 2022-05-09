import React, { FunctionComponent, useMemo } from 'react';
import { AddButton, useSafeIntl, IconButton } from 'bluesquare-components';
import { useFormik, FormikProvider } from 'formik';
import { object, number, string, array, lazy } from 'yup';
import { isEqual } from 'lodash';
import { Box, Grid } from '@material-ui/core';
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
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';

type Props = Partial<SavePlanningQuery> & {
    type: 'create' | 'edit';
};

const makeRenderTrigger = (type: 'create' | 'edit') => {
    if (type === 'create') {
        return ({ openDialog }) => (
            <AddButton
                dataTestId="create-plannning-button"
                onClick={openDialog}
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

export const CreateEditPlanning: FunctionComponent<Props> = ({
    type,
    id,
    name,
    startDate,
    endDate,
    selectedOrgUnits,
    selectedTeam,
    forms,
    publishingStatus,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data: formsDropdown, isFetching: isFetchingForms } = useGetForms();
    const { data: teamsDropdown, isFetching: isFetchingTeams } = useGetTeams();
    // Tried the typescript integration, but Type casting was crap
    const schema = lazy(() =>
        object().shape({
            name: string(),
            startDate: string(),
            endDate: string(),
            forms: string(), // this may be causiing bugs with multi select
            selectedOrgUnits: array().of(number()),
            selectedTeam: number().optional(),
            publishingStatus: string(),
        }),
    );
    const { mutateAsync: savePlanning } = useSavePlanning(type);

    const renderTrigger = useMemo(() => makeRenderTrigger(type), [type]);

    const formik = useFormik({
        initialValues: {
            id,
            name,
            startDate,
            endDate,
            selectedOrgUnits,
            selectedTeam,
            forms,
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
        errors,
        isValid,
        initialValues,
        handleSubmit,
        resetForm,
    } = formik;
    const getErrors = k => (errors[k] ? [errors[k]] : []);
    const titleMessage =
        type === 'create'
            ? formatMessage(MESSAGES.createPlanning)
            : formatMessage(MESSAGES.editPlanning);
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
                                onChange={setFieldValue}
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
                                onChange={setFieldValue}
                                value={values.selectedTeam}
                                errors={getErrors('selectedTeam')}
                                label={MESSAGES.team}
                                required
                                options={teamsDropdown}
                                loading={isFetchingTeams}
                            />
                        </Grid>
                    </Grid>
                    <Grid item xs={12}>
                        <DatesRange
                            onChangeDate={setFieldValue}
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
                                onChange={setFieldValue}
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
                            <OrgUnitTreeviewModal
                                onConfirm={value => {
                                    const selectedIds = value.map(
                                        orgUnit => orgUnit.id,
                                    );
                                    setFieldValue(
                                        'selectedOrgUnits',
                                        selectedIds,
                                    );
                                }}
                                titleMessage={formatMessage(
                                    MESSAGES.selectTopOrgUnit,
                                )}
                                required
                                clearable
                                hardReset
                                multiselect
                                showStatusIconInTree={false}
                                showStatusIconInPicker={false}
                            />
                        </Grid>
                    </Grid>
                    <Grid item>
                        <InputComponent
                            type="radio"
                            keyValue="publishingStatus"
                            onChange={setFieldValue}
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
