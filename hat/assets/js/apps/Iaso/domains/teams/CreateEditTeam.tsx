import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { AddButton, useSafeIntl, IconButton } from 'bluesquare-components';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';
import { Grid } from '@material-ui/core';
import InputComponent from '../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../components/dialogs/ConfirmCancelDialogComponent';

import MESSAGES from './messages';

import { SaveTeamQuery, useSaveTeam } from './hooks/requests/useSaveTeam';
import { useGetProfiles } from '../users/hooks/useGetProfiles';
import { usePlanningValidation } from './validation';
import { IntlFormatMessage } from '../../types/intl';
import { useGetProjectsDropDown } from './hooks/requests/useGetProjectsDropDown';
import { useGetProfilesDropdown } from './hooks/requests/useGetProfilesDropdown';

type ModalMode = 'create' | 'edit';

type Props = Partial<SaveTeamQuery> & {
    type: ModalMode;
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

const formatTitle = (type: ModalMode, formatMessage: IntlFormatMessage) => {
    switch (type) {
        case 'create':
            return formatMessage(MESSAGES.createTeam);
        case 'edit':
            return formatMessage(MESSAGES.editTeam);
        default:
            return formatMessage(MESSAGES.createTeam);
    }
};

export const CreateEditTeam: FunctionComponent<Props> = ({
    type,
    id,
    name,
    description,
    project,
    manager,
    subTeams,
}) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();
    const { data: profliesDropdown, isFetching: isFetchingProfiles } =
        useGetProfilesDropdown();
    const schema = usePlanningValidation();
    const { mutateAsync: savePlanning } = useSaveTeam(type);

    const renderTrigger = useMemo(() => makeRenderTrigger(type), [type]);
    const formik = useFormik({
        initialValues: {
            id,
            name,
            description,
            project,
            manager: manager || currentUser.user_id,
            subTeams: subTeams || [],
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: (values: Partial<SaveTeamQuery>) => savePlanning(values), // TODO: convert forms string to Arry of IDs
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
                maxWidth="xs"
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
                            type="select"
                            keyValue="manager"
                            onChange={onChange}
                            value={values.manager}
                            errors={getErrors('manager')}
                            label={MESSAGES.manager}
                            required
                            options={profliesDropdown}
                            loading={isFetchingProfiles}
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
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
