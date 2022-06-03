import React from 'react';
import PropTypes from 'prop-types';

import InputComponent from '../../../components/forms/InputComponent';
import { APP_LOCALES } from '../../app/constants';

import MESSAGES from '../messages';

const UsersInfos = ({
    setFieldValue,
    currentUser,
    initialData,
    sendEmailInvitation,
}) => (
    <>
        <InputComponent
            keyValue="user_name"
            onChange={(key, value) => setFieldValue(key, value.trim())}
            value={currentUser.user_name.value}
            errors={currentUser.user_name.errors}
            type="text"
            label={MESSAGES.userName}
            required
        />
        <InputComponent
            keyValue="first_name"
            onChange={(key, value) => setFieldValue(key, value)}
            value={currentUser.first_name.value}
            errors={currentUser.first_name.errors}
            type="text"
            label={MESSAGES.firstName}
        />
        <InputComponent
            keyValue="last_name"
            onChange={(key, value) => setFieldValue(key, value)}
            value={currentUser.last_name.value}
            errors={currentUser.last_name.errors}
            type="text"
            label={MESSAGES.lastName}
        />
        <InputComponent
            keyValue="email"
            onChange={(key, value) => setFieldValue(key, value)}
            value={currentUser.email.value}
            errors={currentUser.email.errors}
            type="email"
            label={MESSAGES.email}
        />
        <InputComponent
            keyValue="password"
            onChange={(key, value) => setFieldValue(key, value.trim())}
            value={currentUser.password.value}
            errors={currentUser.password.errors}
            type="password"
            label={initialData ? MESSAGES.newPassword : MESSAGES.password}
            required={!initialData}
        />
        <InputComponent
            keyValue="dhis2_id"
            onChange={(key, value) => setFieldValue(key, value)}
            value={currentUser.dhis2_id.value}
            errors={currentUser.dhis2_id.errors}
            type="text"
            label={MESSAGES.dhis2_id}
        />
        <InputComponent
            keyValue="language"
            onChange={(key, value) => setFieldValue(key, value)}
            value={currentUser.language.value}
            errors={currentUser.language.errors}
            type="select"
            multi={false}
            label={MESSAGES.locale}
            options={APP_LOCALES.map(locale => {
                return {
                    value: locale.code,
                    label: locale.label,
                };
            })}
        />
        {sendEmailInvitation && (
            <InputComponent
                keyValue="send_email_invitation"
                onChange={(key, value) => setFieldValue(key, value)}
                value={currentUser.send_email_invitation.value}
                type="checkbox"
                label={MESSAGES.sent_email_invitation}
            />
        )}
    </>
);

UsersInfos.defaultProps = {
    initialData: null,
};

UsersInfos.propTypes = {
    setFieldValue: PropTypes.func.isRequired,
    currentUser: PropTypes.object.isRequired,
    initialData: PropTypes.object,
};

export default UsersInfos;
