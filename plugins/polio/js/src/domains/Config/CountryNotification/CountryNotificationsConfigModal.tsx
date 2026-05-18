import React, { useCallback, useEffect } from 'react';
import Box from '@mui/material/Box';
import { isEqual } from 'lodash';
import ConfirmCancelDialogComponent from 'Iaso/components/dialogs/ConfirmCancelDialogComponent';
import { UserAsyncSelect } from 'Iaso/components/filters/UserAsyncSelect';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { TeamType } from 'Iaso/domains/teams/constants';
import { useGetTeamsDropdown } from 'Iaso/domains/teams/hooks/requests/useGetTeams';
import { useFormState } from 'Iaso/hooks/form';
import { commaSeparatedIdsToArray } from 'Iaso/utils/forms';
import MESSAGES from '../../../constants/messages';
import { usePutCountryMutation } from './requests';

const initialState = (language, users, teams) => ({
    language: language ?? '',
    users: users ?? [],
    teams: teams ?? [],
});

type Props = {
    renderTrigger: ({
        openDialog,
    }: {
        openDialog: () => void;
    }) => React.JSX.Element;
    countryId: number;
    users: number[];
    allLanguages: Record<string, any>[];
    countryName: string;
    language?: string;
    teams?: Record<string, any>[];
};

export const CountryNotificationsConfigModal = ({
    renderTrigger,
    countryId,
    countryName,
    language = '',
    users,
    allLanguages,
    teams = [],
}: Props) => {
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
            <Box sx={{ pt: 2 }}>
                <UserAsyncSelect
                    filterUsers={config.users.value?.join(',')}
                    handleChange={(_, value) =>
                        setConfig('users', commaSeparatedIdsToArray(value))
                    }
                    additionalFilters={{ has_email: true }}
                    errors={config.users.errors}
                    label={MESSAGES.selectUsers}
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
            </Box>
        </ConfirmCancelDialogComponent>
    );
};
