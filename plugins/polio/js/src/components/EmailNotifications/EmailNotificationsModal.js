import React, { useCallback, useState, useEffect } from 'react';
import ConfirmCancelDialogComponent from '../../../../../../hat/assets/js/apps/Iaso/components/dialogs/ConfirmCancelDialogComponent';
import MESSAGES from '../../constants/messages';
import { getCountryConfigDetails, putCountryConfigDetails } from './requests';
import { useAPI } from '../../../../../../hat/assets/js/apps/Iaso/utils/requests';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { commaSeparatedIdsToArray } from '../../../../../../hat/assets/js/apps/Iaso/utils/forms';

export const EmailNotificationsModal = ({
    renderTrigger,
    countryId,
    language,
    users,
    notifyParent,
}) => {
    const [blockFetch, setBlockFetch] = useState(true);
    const { data: countryDetails } = useAPI(
        getCountryConfigDetails,
        countryId,
        { preventTrigger: blockFetch, additionalDependencies: [] },
    );
    // TODO useFormState to get errors array
    const [selectedUsers, setSelectedUsers] = useState(users);
    const [selectedLanguage, setSelectedLanguage] = useState(language);

    console.log('language', language, 'selectedLanguage', selectedLanguage);

    const onConfirm = useCallback(
        async closeDialog => {
            const result = await putCountryConfigDetails({
                id: countryId,
                users: selectedUsers,
                language: selectedLanguage,
            });
            setSelectedLanguage(result.language);
            setSelectedUsers(result.users);
            notifyParent();
            closeDialog();
        },
        [countryId, selectedUsers, selectedLanguage, notifyParent],
    );
    const reset = useCallback(() => {
        console.log('reset');
        setSelectedUsers(users);
        setSelectedLanguage(language);
    }, [users, language]);

    useEffect(() => {
        setSelectedUsers(users);
        setSelectedLanguage(language);
    }, [language, users]);

    return (
        <ConfirmCancelDialogComponent
            renderTrigger={({ openDialog }) => {
                return renderTrigger({
                    openDialog: () => {
                        setBlockFetch(false);
                        openDialog();
                    },
                });
            }}
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
            allowConfirm
        >
            <div>
                <InputComponent
                    type="select"
                    options={countryDetails?.read_only_users_field.map(user => {
                        return { value: user.id, label: user.username };
                    })}
                    value={selectedUsers}
                    multi
                    label={MESSAGES.selectUsers}
                    onChange={(_, value) =>
                        setSelectedUsers(commaSeparatedIdsToArray(value))
                    }
                    keyValue="users"
                />
                <InputComponent
                    keyValue="language"
                    type="select"
                    options={[
                        { value: 'EN', label: 'EN' },
                        { value: 'FR', label: 'FR' },
                    ]}
                    value={selectedLanguage}
                    multi={false}
                    clearable={false}
                    label={MESSAGES.selectLanguage}
                    onChange={(_, value) => setSelectedLanguage(value)}
                />
            </div>
        </ConfirmCancelDialogComponent>
    );
};

// onConfirm={onConfirm}
// // eslint-disable-next-line no-unused-vars
// onClosed={reset}

// allowConfirm={allowConfirm}
