import React, { useCallback, useState, useEffect } from 'react';
import { isEqual } from 'lodash';
import { arrayOf, object, func, string, number } from 'prop-types';
import ConfirmCancelDialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../../constants/messages';
import { getCountryConfigDetails, putCountryConfigDetails } from './requests';
import { useAPI } from '../../../../../../hat/assets/js/apps/Iaso/utils/requests';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { useFormState } from '../../../../../../hat/assets/js/apps/Iaso/hooks/form';

const makeDropDownListName = user => {
    if (user.first_name && user.last_name)
        return `${user.first_name} ${user.last_name}`;
    return `${user.user_name}`;
};

const makeDropDownListItem = user => {
    return {
        value: user.user_id,
        label: makeDropDownListName(user),
    };
};

const makeDropDownList = allUsers => {
    return allUsers.map(makeDropDownListItem);
};

const initialState = (language, users) => ({
    language: language ?? '',
    users: users ?? [],
});

export const EmailNotificationsModal = ({
    renderTrigger,
    countryId,
    language,
    users,
    notifyParent,
    allUsers,
    allLanguages,
}) => {
    const [blockFetch, setBlockFetch] = useState(true);
    const { data: countryDetails } = useAPI(
        getCountryConfigDetails,
        countryId,
        { preventTrigger: blockFetch, additionalDependencies: [] },
    );
    const [config, setConfig] = useFormState(initialState(language, users));
    const [allowConfirm, setAllowConfirm] = useState(false);

    const onConfirm = useCallback(
        async closeDialog => {
            const result = await putCountryConfigDetails({
                id: countryId,
                users: config.users.value,
                language: config.language.value,
            });
            setConfig('users', result.users);
            setConfig('language', result.language);
            notifyParent();
            closeDialog();
        },
        [countryId, config.users, config.language, notifyParent, setConfig],
    );

    const syncStateWithProps = useCallback(() => {
        setConfig('users', users);
        setConfig('language', language);
    }, [language, users, setConfig]);

    const reset = useCallback(() => {
        syncStateWithProps();
        setAllowConfirm(false);
    }, [syncStateWithProps]);

    const handleAllowConfirm = useCallback(() => {
        if (
            allowConfirm &&
            config.language.value === language &&
            isEqual(config.users.value, users)
        ) {
            setAllowConfirm(false);
        } else if (
            !allowConfirm &&
            (config.language.value !== language ||
                !isEqual(config.users.value, users))
        ) {
            setAllowConfirm(true);
        }
    }, [
        allowConfirm,
        config.language.value,
        config.users.value,
        users,
        language,
    ]);

    const handleModalOpen = useCallback(
        ({ openDialog }) => {
            return renderTrigger({
                openDialog: () => {
                    setBlockFetch(false);
                    openDialog();
                },
            });
        },
        [renderTrigger],
    );

    useEffect(syncStateWithProps, [syncStateWithProps]);

    useEffect(handleAllowConfirm, [handleAllowConfirm]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={handleModalOpen}
            titleMessage={{
                ...MESSAGES.configEmailNotif,
                values: { country: countryDetails?.country_name },
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

EmailNotificationsModal.propTypes = {
    renderTrigger: func.isRequired,
    countryId: number.isRequired,
    language: string,
    users: arrayOf(number).isRequired,
    notifyParent: func,
    allUsers: arrayOf(object),
    allLanguages: arrayOf(object).isRequired,
};

EmailNotificationsModal.defaultProps = {
    notifyParent: () => null,
    allUsers: [],
    language: '',
};
