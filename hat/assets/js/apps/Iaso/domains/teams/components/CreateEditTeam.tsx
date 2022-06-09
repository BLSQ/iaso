import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useEffect,
} from 'react';
// @ts-ignore
import { AddButton, useSafeIntl, IconButton } from 'bluesquare-components';
// @ts-ignore
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import { useFormik, FormikProvider } from 'formik';
import { isEqual } from 'lodash';

import InputComponent from '../../../components/forms/InputComponent';
import ConfirmCancelDialogComponent from '../../../components/dialogs/ConfirmCancelDialogComponent';

import { commaSeparatedIdsToArray } from '../../../utils/forms';
import { useTeamValidation } from '../validation';
import { IntlFormatMessage } from '../../../types/intl';

import { SaveTeamQuery, useSaveTeam } from '../hooks/requests/useSaveTeam';
import { useGetProjectsDropDown } from '../hooks/requests/useGetProjectsDropDown';
import { useGetProfilesDropdown } from '../hooks/requests/useGetProfilesDropdown';
import { useGetTeams } from '../hooks/requests/useGetTeams';

import { TEAM_OF_TEAMS, TEAM_OF_USERS } from '../constants';
import MESSAGES from '../messages';

type ModalMode = 'create' | 'edit';

type Props = Partial<SaveTeamQuery> & {
    dialogType: ModalMode;
};

const makeRenderTrigger = (dialogType: 'create' | 'edit') => {
    if (dialogType === 'create') {
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

const formatTitle = (
    dialogType: ModalMode,
    formatMessage: IntlFormatMessage,
) => {
    switch (dialogType) {
        case 'create':
            return formatMessage(MESSAGES.createTeam);
        case 'edit':
            return formatMessage(MESSAGES.editTeam);
        default:
            return formatMessage(MESSAGES.createTeam);
    }
};

export const CreateEditTeam: FunctionComponent<Props> = ({
    dialogType,
    id,
    name,
    description,
    project,
    manager,
    subTeams,
    type,
    users,
}) => {
    const { formatMessage } = useSafeIntl();
    const currentUser = useCurrentUser();
    const { data: projectsDropdown, isFetching: isFetchingProjects } =
        useGetProjectsDropDown();
    const { data: profliesDropdown, isFetching: isFetchingProfiles } =
        useGetProfilesDropdown();
    const { data: teamsDropdown, isFetching: isFetchingTeams } = useGetTeams({
        project,
        select: teams => {
            if (!teams) return [];
            const filteredTeams = teams.filter(team => team.id !== id);
            return filteredTeams.map(team => {
                return {
                    value: team.id.toString(),
                    label: team.name,
                };
            });
        },
    });

    const schema = useTeamValidation();

    const formik = useFormik({
        initialValues: {
            id,
            name,
            description,
            project,
            manager: manager || currentUser.user_id,
            subTeams: subTeams || [],
            type,
            users: users || [],
        },
        enableReinitialize: true,
        validateOnBlur: true,
        validationSchema: schema,
        onSubmit: (values: Partial<SaveTeamQuery>) => savePlanning(values), // TODO: convert forms string to Array of IDs
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

    const { mutateAsync: savePlanning } = useSaveTeam(dialogType, resetForm);

    const renderTrigger = useMemo(
        () => makeRenderTrigger(dialogType),
        [dialogType],
    );
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
    const titleMessage = formatTitle(dialogType, formatMessage);

    useEffect(() => {
        if (values.type === TEAM_OF_USERS) {
            setFieldValue('subTeams', []);
        }
        if (values.type === TEAM_OF_TEAMS) {
            setFieldValue('users', []);
        }
    }, [setFieldValue, values.type]);

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
                    keyValue="type"
                    onChange={onChange}
                    value={values.type}
                    errors={getErrors('type')}
                    label={MESSAGES.type}
                    options={[
                        {
                            label: formatMessage(MESSAGES.teamsOfTeams),
                            value: TEAM_OF_TEAMS,
                        },
                        {
                            label: formatMessage(MESSAGES.teamsOfUsers),
                            value: TEAM_OF_USERS,
                        },
                    ]}
                />
                {values.type === TEAM_OF_USERS && (
                    <InputComponent
                        type="select"
                        keyValue="users"
                        onChange={(key, value) =>
                            onChange(key, commaSeparatedIdsToArray(value))
                        }
                        value={values.users}
                        errors={getErrors('users')}
                        label={MESSAGES.users}
                        options={profliesDropdown}
                        loading={isFetchingProfiles}
                        multi
                    />
                )}
                {values.type === TEAM_OF_TEAMS && (
                    <InputComponent
                        type="select"
                        keyValue="subTeams"
                        onChange={(key, value) =>
                            onChange(key, commaSeparatedIdsToArray(value))
                        }
                        value={values.subTeams}
                        errors={getErrors('subTeams')}
                        label={MESSAGES.title}
                        options={teamsDropdown}
                        loading={isFetchingTeams}
                        multi
                    />
                )}
            </ConfirmCancelDialogComponent>
        </FormikProvider>
    );
};
