import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
// @ts-ignore
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
            fields[formKey] = false;
        });
        setTouched(fields);
    };

// TODO move to utils
const formHasBeenTouched = (touchedDict: Record<string, boolean>) => {
    return Boolean(
        Object.keys(touchedDict).find(dictKey => touchedDict[dictKey] === true),
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
    const [errorMessage, setErrorMessage] = useState(null);
    const [closeModal, setCloseModal] = useState<any>();

    // Tried the typescript integration, but Type casting was crap
    const schema = usePlanningValidation(errorMessage);

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
        onSubmit: (values: Partial<SavePlanningQuery>) =>
            savePlanning(values, {
                onError: (e: any) => {
                    setErrorMessage(e.details);
                    resetTouched();
                },
                onSuccess: () => {
                    closeModal.closeDialog();
                },
            }), // TODO: convert forms string to Array of IDs
    });

    const {
        values,
        setFieldValue,
        touched,
        setFieldTouched,
        setTouched,
        errors,
        isValid,
        handleSubmit,
        resetForm,
    } = formik;
    // using this method to reset touched state after saving
    const resetTouched = makeResetTouched(values, setTouched);
    // console.log('errors formik', errors);

    const { mutateAsync: savePlanning } = useSavePlanning(type, resetForm);
    const { data: formsDropdown, isFetching: isFetchingForms } = useGetForms(
        values?.project,
    );
    const { data: teamsDropdown, isFetching: isFetchingTeams } = useGetTeams(
        values?.project,
    );
    // TODO filter out by team and forms
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();

    // const onConfirm = useCallback(async closeDialog => {
    //     await handleSubmit();
    // });

    const renderTrigger = useMemo(() => makeRenderTrigger(type), [type]);

    const onChange = (keyValue, value) => {
        setFieldTouched(keyValue, true);
        setFieldValue(keyValue, value);
    };
    const getErrors = useCallback(
        keyValue => {
            // HERE bug when handling errors
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
                // Using touched i.o initialValues to evaluate if form has been modified
                allowConfirm={isValid && formHasBeenTouched(touched)}
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
                <Grid container spacing={2}>
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
                        <InputComponent
                            keyValue="description"
                            onChange={onChange}
                            value={values.description}
                            errors={getErrors('description')}
                            type="text"
                            label={MESSAGES.description}
                        />
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
                        <Box mt={1}>
                            <Field
                                required
                                component={OrgUnitSelect}
                                label={formatMessage(MESSAGES.selectOrgUnit)}
                                name="selectedOrgUnit"
                            />
                        </Box>
                    </Grid>
                    <Grid item xs={12}>
                        <DatesRange
                            marginTop={-2}
                            onChangeDate={onChange}
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
                        />
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
