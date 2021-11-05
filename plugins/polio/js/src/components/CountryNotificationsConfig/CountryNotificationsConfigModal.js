import React, { useCallback, useEffect } from 'react';
import { isEqual } from 'lodash';
import { arrayOf, func, number, object, string } from 'prop-types';
import ConfirmCancelDialogComponent from 'iaso/components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../../constants/messages';
import { usePutCountryMutation } from './requests';
import InputComponent from 'iaso/components/forms/InputComponent';
import { commaSeparatedIdsToArray } from 'iaso/utils/forms';
import { useFormState } from 'iaso/hooks/form';

const makeDropDownListItem = user => {
    return {
        value: user.user_id,
        label: user.email,
    };
};

const makeDropDownList = allUsers => {
    return allUsers
        .filter(user => Boolean(user.email))
        .map(makeDropDownListItem)
        .sort((a, b) => a.label >= b.label);
};

const initialState = (language, users) => ({
    language: language ?? '',
    users: users ?? [],
});

export const CountryNotificationsConfigModal = ({
    renderTrigger,
    countryId,
    countryName,
    language,
    users,
    allUsers,
    allLanguages,
}) => {
    const [config, setConfig] = useFormState(initialState(language, users));
    const { mutateAsync } = usePutCountryMutation();

    const onConfirm = async closeDialog => {
        const result = await mutateAsync({
            id: countryId,
            users: config.users.value,
            language: config.language.value,
        });
        setConfig('users', result.users);
        setConfig('language', result.language);
        closeDialog();
    };

    const syncStateWithProps = useCallback(() => {
        setConfig('users', users);
        setConfig('language', language);
    }, [language, users, setConfig]);

    const reset = useCallback(() => {
        syncStateWithProps();
    }, [syncStateWithProps]);

    let allowConfirm = false;
    if (
        config.language.value === language &&
        isEqual(config.users.value, users)
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
};

CountryNotificationsConfigModal.defaultProps = {
    allUsers: [],
    language: '',
};
