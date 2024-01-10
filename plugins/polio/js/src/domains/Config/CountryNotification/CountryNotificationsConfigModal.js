import React, { useCallback, useEffect } from 'react';
import { isEqual } from 'lodash';
import { arrayOf, func, number, object, string } from 'prop-types';
import ConfirmCancelDialogComponent from 'Iaso/components/dialogs/ConfirmCancelDialogComponent';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import { useFormState } from 'Iaso/hooks/form';
import { usePutCountryMutation } from './requests';
import MESSAGES from '../../../constants/messages';
import { useGetTeamsDropdown } from '../../../../../../../hat/assets/js/apps/Iaso/domains/teams/hooks/requests/useGetTeams.ts';
import { TeamType } from '../../../../../../../hat/assets/js/apps/Iaso/domains/teams/constants.ts';

const makeDropDownListItem = user => {
    const userName =
        user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.user_name;
    return {
        value: user.user_id,
        label: `${userName} - ${user.email}`,
    };
};

const makeDropDownList = allUsers => {
    return allUsers
        .filter(user => Boolean(user.email))
        .map(makeDropDownListItem)
        .sort((a, b) => a.label >= b.label);
};

const initialState = (language, users, teams) => ({
    language: language ?? '',
    users: users ?? [],
    teams: teams ?? [],
});

export const CountryNotificationsConfigModal = ({
    renderTrigger,
    countryId,
    countryName,
    language,
    users,
    allUsers,
    allLanguages,
    teams,
}) => {
    const [config, setConfig] = useFormState(
        initialState(language, users, teams),
    );
    const { mutateAsync } = usePutCountryMutation();
    const { data: teamsDropdown = [], isFetching: isFetchingTeams } =
        useGetTeamsDropdown({
            type: TeamType.TEAM_OF_USERS,
        });

    const onConfirm = async closeDialog => {
        const result = await mutateAsync({
            id: countryId,
            users: config.users.value,
            language: config.language.value,
            teams: config.teams.value,
        });
        setConfig('users', result.users);
        setConfig('language', result.language);
        setConfig('teams', result.teams);
        closeDialog();
    };

    const syncStateWithProps = useCallback(() => {
        setConfig('users', users);
        setConfig('language', language);
        setConfig('teams', teams);
    }, [setConfig, users, language, teams]);

    const reset = useCallback(() => {
        syncStateWithProps();
    }, [syncStateWithProps]);

    let allowConfirm = false;
    if (
        config.language.value === language &&
        isEqual(config.users.value, users) &&
        isEqual(config.teams.value, teams)
    ) {
        allowConfirm = false;
    } else {
        allowConfirm = true;
    }

    useEffect(syncStateWithProps, [syncStateWithProps]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={renderTrigger}
            titleMessage={{
                ...MESSAGES.configEmailNotif,
                values: { country: countryName },
            }}
            confirmMessage={MESSAGES.confirm}
            cancelMessage={MESSAGES.cancel}
            maxWidth="sm"
            onConfirm={onConfirm}
            onCancel={closeDialog => {
                closeDialog();
                reset();
            }}
            allowConfirm={allowConfirm}
        >
            <div>
                <InputComponent
                    type="select"
                    keyValue="users"
                    label={MESSAGES.selectUsers}
                    errors={config.users.errors}
                    value={config.users.value}
                    onChange={(_, value) =>
                        setConfig('users', commaSeparatedIdsToArray(value))
                    }
                    options={makeDropDownList(allUsers)}
                    multi
                />
                <InputComponent
                    type="select"
                    keyValue="language"
                    label={MESSAGES.selectLanguage}
                    value={config.language.value}
                    errors={config.language.errors}
                    onChange={(_, value) => setConfig('language', value)}
                    options={allLanguages}
                    multi={false}
                    clearable={false}
                />
                <InputComponent
                    type="select"
                    keyValue="teams"
                    onChange={(key, value) =>
                        setConfig(key, commaSeparatedIdsToArray(value))
                    }
                    value={config.teams.value}
                    errors={config.teams.error}
                    label={MESSAGES.teams}
                    options={teamsDropdown ?? []}
                    loading={isFetchingTeams}
                    multi
                />
            </div>
        </ConfirmCancelDialogComponent>
    );
};

CountryNotificationsConfigModal.propTypes = {
    renderTrigger: func.isRequired,
    countryId: number.isRequired,
    language: string,
    users: arrayOf(number).isRequired,
    allUsers: arrayOf(object),
    allLanguages: arrayOf(object).isRequired,
    countryName: string.isRequired,
    teams: arrayOf(object),
};

CountryNotificationsConfigModal.defaultProps = {
    allUsers: [],
    language: '',
    teams: [],
};
